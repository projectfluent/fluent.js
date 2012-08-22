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

  function _load(uri, callback) {
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType('text/plain');
    xhr.addEventListener("load", function() {
      callback(xhr.responseText)
    });
    xhr.open('GET', uri, true);
    xhr.send('');
  }

  var resCache = {};

  function Resource(uri) {
    // probably need to resolve all paths relative to l20n.js
    if (resCache[uri]) {
      return resCache[uri];
    }

    //var uri = uri;
    var ast = null;
    var callbacks = [];

    var isDownloaded = false;
    var isPreprocessed = false;

    var len = 0;
    var self = this;

    function endPreprocessing() {
      isPreprocessed = true;
      resCache[uri] = self;
      callbacks.forEach(function(callback) {
        callback(ast);
      });
      callbacks = [];
    }

    function inject(subAST, pos) {
      Array.prototype.splice.apply(ast, [pos, 1].concat(subAST));
      if (--len == 0) {
        endPreprocessing();
      }
    }

    function preprocess() {
      len = ast.reduce(function(prev, curr) {
        return curr.type == 'ImportStatement' ? prev + 1 : prev;
      }, 0);

      if (len == 0) {
        endPreprocessing();
        return;
      }
      ast.forEach(function(node, pos) {
        if (node.type == 'ImportStatement') {
          var imported = new Resource(node.uri.content);
          imported.load(function(subAST) {
            inject(subAST, pos);
          });
        }
      });
    }

    function parse(data) {
      isDownloaded = true;
      ast = L20n.Parser.parse(data).body;
      preprocess();
    }

    this.load = function Resource_load(callback) {
      if (isPreprocessed) {
        callback(ast);
        return;
      }
      callbacks.push(callback);
      if (!isDownloaded) {
        _load(uri, parse);
      }
    }

    this.__defineGetter__('isReady', function() {
      return isPreprocessed;
    });

    this.getAST = function Resource_getAST() {
      if (!isPreprocessed) {
        throw "Resource not ready";
      }
      return ast;
    }
  }


  function Context() {
    var resources= []; // resource files in order

    var ast = []; // the full AST
    var entries = {}; // resource entries
    var ctxdata = {}; // context variables

    var isFrozen = false;
    var isCompiled = false;

    var ASYNC_TIMEOUT = 500;
    var self = this;

    function getArgs(data) {
      var args = Object.create(ctxdata);
      if (data) {
        for (var i in data) {
          args[i] = data[i];
        }
      }
      return args;
    }

    function isReady() {
      if (!isFrozen) {
        return false;
      }
      for (var i in resources) {
        if (!resources[i].isReady) {
          return false;
        }
      }
      return true;
    }

    function compile() {
      ast = resources.reduce(function(prev, curr) {
        return prev.concat(curr.getAST());
      }, []);
      L20n.Compiler.compile(ast, entries, globals);
      isCompiled = true;
      fireReadyEvent();
    }

    function fireReadyEvent() {
      console.log('fired', { ast:ast, entries:entries});
      var event = document.createEvent('Event');
      event.initEvent('LocalizationReady', false, false);
      event.ctx = self;
      document.dispatchEvent(event);
    }

    function compileIfCtxReady() {
      if (isReady()) {
        compile();
      }
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
      var res = new Resource(uri);
      resources.push(res);
      res.load(compileIfCtxReady);
    };

    this.freeze = function() {
      isFrozen = true;
      compileIfCtxReady();
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
