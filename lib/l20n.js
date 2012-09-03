(function() {
  'use strict';

  var L20n;

  if (typeof exports !== 'undefined') {
    L20n = exports;
    L20n.Parser = require('./parser.js');
    L20n.Compiler = require('./compiler.js');
  } else {
    L20n = this.L20n = {};
  }

  L20n.getContext = function L20n_getContext() {
    return new Context();
  };

  var globals = {
    get hour() {
      return new Date().getHours();
    },
    get os() {
      if (/^MacIntel/.test(navigator.platform)) {
        return 'mac';
      }
      if (/^Linux/.test(navigator.platform)) {
        return 'linux';
      }
      if (/^Win/.test(navigatgor.platform)) {
        return 'win';
      }
      return 'unknown';
    },
  };

  var Cache = {
    LOLCache: {},
    resCache: {},
    getLOLFile: function(uri) {
      if (!this.LOLCache[uri]) {
        this.LOLCache[uri] = new LOLFile(uri);
      }
      return this.LOLCache[uri];
    },
    getResource: function(uri) {
      if (!this.resCache[uri]) {
        this.resCache[uri] = new Resource(uri);
      }
      return this.resCache[uri];
    },
  }

  function _ifReady(self, fn) {
    return function ifReady() {
      if (self.isReady()) {
        fn.apply(self, arguments);
      }
    }
  }

  function _fire(callbacks, args) {
    callbacks.forEach(function(callback) {
      callback.apply(this, args);
    });
    callbacks.length = 0;
  }

  function LOLFile(uri) {
    //var uri = uri;
    var ast = null;
    var imports = null;
    var callbacks = [];
    var isDownloading = false;

    function download(uri, callback) {
      var xhr = new XMLHttpRequest();
      xhr.overrideMimeType('text/plain');
      xhr.addEventListener("load", function() {
        callback(xhr.responseText)
      });
      xhr.open('GET', uri, true);
      xhr.send('');
    }

    function parse(data) {
      ast = L20n.Parser.parse(data).body;
      imports = ast.filter(function(elem) {
        return elem.type == 'ImportStatement';
      });
      _fire(callbacks, [ast, imports]);
    }

    this.get = function LOLFile_get(callback) {
      if (ast) {
        callback(ast, imports);
      } else {
        callbacks.push(callback);
        if (!isDownloading) {
          isDownloading = true;
          download(uri, parse);
        }
      }
    }
  }

  function Resource(uri) {

    //var uri = uri;
    var rawast = [];
    var callbacks = [];

    this.ast = [];
    this.resources = []; // imported resources in order
    this.isPreprocessed = false;

    var lol = Cache.getLOLFile(uri);
    var self = this;

    function preprocess() {
      if (this.isPreprocessed) {
        return;
      }
      rawast.forEach(function(node) {
        if (node.type == 'ImportStatement') {
          var importedAST = this.resources.shift().ast;
          this.ast = self.ast.concat(importedAST);
        } else {
          this.ast.push(node);
        }
      }, this);
      this.isPreprocessed = true;
      _fire(callbacks);
    }

    this.load = function load(callback, nesting) {
      if (this.isPreprocessed) {
        callback();
      } else {
        callbacks.push(callback);
        lol.get(function resolveImports(lolast, imports) {
          rawast = lolast;
          if (imports.length) {
            imports.forEach(function(node){
              self.loadResource(node.uri.content, _ifReady(self, preprocess), 
                nesting + 1);
            });
          } else {
            self.ast = rawast;
            self.isPreprocessed = true;
            _fire(callbacks);
          }
        });
      }
    }

    this.loadResource = function loadResource(uri, callback, nesting) {
      nesting = nesting || 0;
      if (nesting > 7) {
        throw "Too many nested imports";
      }
      var imported = Cache.getResource(uri);
      this.resources.push(imported);
      imported.load(callback, nesting);
    }

    this.isReady = function() {
      for (var i in this.resources) {
        if (!this.resources[i].isPreprocessed) {
          return false;
        }
      }
      return true;
    }
  }

  function Context() {

    var entries = {}; // resource entries
    var ctxdata = {}; // context variables

    var isFrozen = false;
    var isCompiled = false;

    var ASYNC_TIMEOUT = 500;
    var self = this;

    // Context is a top-level resource that imports other resources.  The only 
    // difference is that a regular resource is a file, and the EOF marks the 
    // moment when the resource no longer accepts new imports.  For the 
    // context's meta resource we need the `freeze` method to simulate this 
    // behavior.
    var meta = new Resource();

    meta.isReady = function Meta_isReady() {
      if (!isFrozen) {
        return false;
      }
      for (var i in this.resources) {
        if (!this.resources[i].isPreprocessed) {
          return false;
        }
      }
      return true;
    }

    function compile() {
      if (isCompiled) {
        return;
      }
      // flatten the AST
      meta.ast = meta.resources.reduce(function(prev, curr) {
        return prev.concat(curr.ast);
      }, []);
      L20n.Compiler.compile(meta.ast, entries, globals);
      isCompiled = true;
      fireReadyEvent();
    }

    function fireReadyEvent() {
      console.log('fired', self)
      var event = document.createEvent('Event');
      event.initEvent('LocalizationReady', false, false);
      event.ctx = self;
      document.dispatchEvent(event);
    }

    function getArgs(data) {
      var args = Object.create(ctxdata);
      if (data) {
        for (var i in data) {
          args[i] = data[i];
        }
      }
      return args;
    }

    function getSync(id, data) {
      if (!isCompiled) {
        throw "Error: not compiled";
      }
      var entity = entries[id];
      if (!entity || entity.local) {
        console.warn("No such entity: " + id);
        return null;
      }
      var args = getArgs(data);
      return entity.toString(args);
    };

    function getAsync(id, data, callback, fallback) {
      if (isCompiled) {
        callback(getSync(id, data));
      }
      var overdue = false;
      var ttl = window.setTimeout(function() {
        overdue = true;
        // fallback is just a string, can't interpolate context data
        callback(fallback);
      }, ASYNC_TIMEOUT);

      document.addEventListener('LocalizationReady', function(event) {
        if (overdue || event.ctx !== self) {
          return;
        }
        window.clearTimeout(ttl);
        callback(getSync(id, data));
      });
    };

    this.__defineSetter__('timeout', function(ms) {
      ASYNC_TIMEOUT = ms;
    });

    this.__defineGetter__('timeout', function() {
      return ASYNC_TIMEOUT;
    });

    this.__defineSetter__('data', function(data) {
      ctxdata = data;
    });

    this.__defineGetter__('data', function() {
      return ctxdata;
    });

    this.addResource = function(uri) {
      if (isFrozen) {
        throw "Context is frozen, can't add more resources";
      }
      meta.loadResource(uri, _ifReady(meta, compile));
    };

    this.freeze = function() {
      isFrozen = true;
      _ifReady(meta, compile);
    };

    this.get = function(id, data, callback, fallback) {
      if (callback !== undefined) {
        getAsync(id, data, callback, fallback);
      } else {
        return getSync(id, data);
      }
    };

    this.getAttribute = function(id, attr, data) {
      if (!isCompiled) {
        throw "Error: not compiled";
      }
      var entity = entries[id];
      if (!entity || entity.local) {
        console.warn("No such entity: " + id);
        return null;
      }
      var attribute = entity.attributes[attr]
      if (!attribute || attribute.local) {
        console.warn("No such attribute: " + attr);
        return null;
      }
      var args = this._getArgs(data);
      return attribute.toString(args);
    };

    this.getAttributes = function(id, data) {
      if (!isCompiled) {
        throw "Error";
      }
      var entity = entries[id];
      if (!entity || entity.local) {
        console.warn("No such entity: " + id);
        return null;
      }
      var args = this._getArgs(data);
      var attributes = {};
      for (var attr in entity.attributes) {
        var attribute = entity.attributes[attr];
        if (!attribute.local) {
          attributes[attr] = attribute.toString(args);
        }
      }
      return attributes;
    }
  }
}).call(this);
