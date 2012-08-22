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

  function Resource(aURI) {
    // probably need to resolve all paths relative to l20n.js
    if (resCache[aURI]) {
      return resCache[aURI];
    }

    var uri = aURI;
    var ast = null;
    var callbacks = [];

    var downloaded = true;
    var preprocessed = false;

    var len = 0;
    var self = this;

    function endPreprocessing() {
      preprocessed = true;
      resCache[uri] = self;
      callbacks.forEach(function(callback) {
        callback(ast);
      });
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
      downloaded = true;
      ast = L20n.Parser.parse(data).body;
      preprocess();
    }

    this.load = function Resource_load(callback) {
      if (preprocessed) {
        callback(ast);
        return;
      }
      callbacks.push(callback);
      if (!downloaded) {
        _load(uri, parse);
      }
    }

    this.isReady = function Resource_isReady() {
      return preprocessed;
    }

    this.getAST = function Resource_getAST() {
      if (!preprocessed) {
        throw "Resource not ready";
      }
      return ast;
    }
  }


  function Context() {
    var mFrozen = false;
    var mCompiled = false;

    var mResources = {}; // resource files
    var mResourcesInOrder = []; // resource files in order
    var mObjects = {
      'ast': [],
      'entries': {}, // resource entries
      'ctxdata': {}, // context variables
      'globals': {}, // global variables
    };
    var ASYNC_TIMEOUT = 500;


    var self = this;

    function getArgs(data) {
      var args = Object.create(mObjects['ctxdata'])
      if (data) {
        for (var i in data) {
          args[i] = data[i];
        }
      }
      return args;
    }

    function isReady() {
      if (!mFrozen) {
        return false;
      }
      for (var i in mResources) {
        if (!mResources[i].isReady()) {
          return false;
        }
      }
      return true;
    }

    function compile() {
      mObjects.ast = mResourcesInOrder.reduce(function(prev, curr) {
        return prev.concat(curr.getAST());
      }, []);
      L20n.Compiler.compile(mObjects.ast, mObjects.entries, globals);
      mCompiled = true;
      fireReadyEvent();
    }

    function fireReadyEvent() {
      console.log('fired', mObjects);
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

    this.__defineSetter__('timeout', function(ms) {
      ASYNC_TIMEOUT = ms;
    });

    this.__defineGetter__('timeout', function() {
      return ASYNC_TIMEOUT;
    });

    this.__defineSetter__('data', function(data) {
      mObjects.ctxdata = data;
    });

    this.__defineGetter__('data', function() {
      return mObjects.ctxdata;
    });

    this.addResource = function(uri) {
      if (mFrozen) {
        throw "Context is frozen, can't add more resources";
      }
      var res = new Resource(uri);
      mResourcesInOrder.push(res);
      mResources[uri] = res;
      res.load(compileIfCtxReady);
    };

    this.freeze = function() {
      mFrozen = true;
      compileIfCtxReady();
    };

    this._getSync = function(id, data) {
      if (!mCompiled) {
        throw "Error: not compiled";
      }
      var entity = mObjects['entries'][id]
      if (!entity || entity.local) {
        console.warn("No such entity: " + id);
        return null;
      }
      var args = getArgs(data);
      return entity.toString(args);
    };

    this._getAsync = function(id, data, callback, fallback) {
      if (mCompiled) {
        callback(this._getSync(id, data));
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
        callback(self._getSync(id, data));
      });
    };

    this.get = function(id, data, callback, fallback) {
      if (callback !== undefined) {
        this._getAsync(id, data, callback, fallback);
      } else {
        return this._getSync(id, data);
      }
    };

    this.getAttribute = function(id, attr, data) {
      if (!mCompiled) {
        throw "Error: not compiled";
      }
      var entity = mObjects['entries'][id];
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
      if (!mCompiled) {
        throw "Error";
      }
      var entity = mObjects['entries'][id];
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
