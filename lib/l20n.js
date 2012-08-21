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
    if (resCache[aURI])
      return resCache[aURI];

    var uri = aURI;
    var ast = null;

    var loaded = false;
    var preprocessed = false;
    var compiled = false;

    var len = 0;

    function inject(subAST, pos, callback) {
      Array.prototype.splice.apply(ast, [pos, 1].concat(subAST));
      if (--len == 0) {
        endPreprocessing(callback);
      }
    }

    function endPreprocessing(callback) {
      preprocessed = true;
      resCache[uri] = this;
      callback(ast);
    }

    function preprocess(callback) {
      len = ast.reduce(function(prev, curr) {
        return curr.type == 'ImportStatement' ? prev + 1 : prev;
      }, 0);

      if (len == 0) {
        endPreprocessing(callback);
        return;
      }
      ast.forEach(function(node, pos) {
        if (node.type == 'ImportStatement') {
          var imported = new Resource(node.uri.content);
          imported.load(function(subAST) {
            inject(subAST, pos, callback);
          });
        }
      }, this);
    }

    function parse(data, callback) {
      loaded = true;
      ast = L20n.Parser.parse(data).body;
      preprocess(callback);
    }

    return {
      uri: uri,
      load: function Resource_load(callback) {
        if (preprocessed) {
          callback(ast);
        }
        _load(uri, function(data) {
          parse(data, callback);
        });
      },
    }
  }


  function Context() {
    var mFrozen = false;
    var mCompiled = false;
    var mPreprocessed = false;
    var mResources = {}; // resource files
    var mEvents = {'ready': []}

    var mObjects = {
      'ast': [],
      'entries': {}, // resource entries
      'ctxdata': {}, // context variables
      'globals': {}, // global variables
    }

    mObjects['globals'] = {
      get hour() {
        return new Date().getHours();
      },
      get os() {
        if (/^MacIntel/.test(navigator.platform)) {
          return 'mac'
        }
        if (/^Linux/.test(navigator.platform)) {
          return 'linux'
        }
        if (/^Win/.test(navigatgor.platform)) {
          return 'win'
        }
        return 'unknown'
      },
    }

    function preprocessAST(ast) {
      var self = this;
      ast.forEach(function(node, pos) {
        if (node.type == 'ImportStatement') {
          self._getObject(node.uri.content, function(subAST) {
            ast.splice.apply(ast, [pos, 1].concat(subAST.body))
          })
        }
      })
      mPreprocessed = true;
      if (this.isReady()) {
        this.onASTReady();
      }
    }

    function getArgs(data) {
      var args = Object.create(mObjects['ctxdata'])
      if (data) {
        for (var i in data) {
          args[i] = data[i]
        }
      }
      return args
    }

    function isReady() {
      if (!mFrozen)
        return false;
      for (var i in mResources)
        if (mResources[i]._loading)
          return false;
        return true;
    }

    function onASTReady() {
      if (mCompiled)
        return
      if (!mPreprocessed) {
        this.__preprocessAST(mObjects['ast']);
      } else {
        L20n.Compiler.compile(mObjects['ast'],
          mObjects['entries'],
        mObjects['globals']);
        mCompiled = true
        this._fireCallbacks(); 
      }
    }

    function getAST() {
      return {'res': mResources, 'obj': mObjects};
    }

    function fireReadyEvent(lang) {
      var event = document.createEvent('Event');
      event.initEvent('LocalizationReady', false, false);
      event.ctx = this;
      window.dispatchEvent(event);
    }

    return {
      set data(data) {
        mObjects['ctxdata'] = data
      },
      get data() {
        return mObjects['ctxdata'];
      },
      addResource: function(uri) {
        var res = new Resource(uri);
        mObjects.ast.push(res);
        var pos = mObjects.ast.length - 1;
        res.load(function injectResource(ast) {
          Array.prototype.splice.apply(mObjects.ast, [pos, 1].concat(ast));
          console.log(mObjects)
        });
        mResources[uri] = res;

      },
      get: function(id, data) {
        if (!mCompiled)
          throw "Error"
        var entity = mObjects['entries'][id]
        if (!entity || entity.local) {
          console.warn("No such entity: " + id)
          return null
        }
        var args = this._getArgs(data)
        return entity.toString(args)
      },
      getAsync: function(id, data, callback, fallback) {
        if (mCompiled)
          callback(this.get(id, data))
        var overdue = false;
        var ttl = window.setTimeout(function() {
          // parse & compile and interpolate data?
          overdue = true;
          callback(fallback);
        }, 2000);
        document.addEventListener('L20nReady', function(event) {
          if (overdue || event.ctx != this) 
            return
          window.clearTimeout(ttl);
          callback(this.get(id, data));
        });
        if (!mCompiled)
          throw "Error"
        var entity = mObjects['entries'][id]
        if (!entity || entity.local) {
          console.warn("No such entity: " + id)
          return null
        }
        var args = this._getArgs(data)
        return entity.toString(args)
      },
      getAttribute: function(id, attr, data) {
        if (!mCompiled)
          throw "Error"
        var entity = mObjects['entries'][id]
        if (!entity || entity.local) {
          console.warn("No such entity: " + id)
          return null
        }
        var attribute = entity.attributes[attr]
        if (!attribute || attribute.local) {
          console.warn("No such attribute: " + attr)
          return null
        }
        var args = this._getArgs(data)
        return attribute.toString(args)
      },
      getAttributes: function(id, data) {
        if (!mCompiled)
          throw "Error"
        var entity = mObjects['entries'][id]
        if (!entity || entity.local) {
          console.warn("No such entity: " + id)
          return null
        }
        var args = this._getArgs(data)
        var attributes = {};
        for (var attr in entity.attributes) {
          var attribute = entity.attributes[attr]
          if (!attribute.local)
            attributes[attr] = attribute.toString(args)
          }
          return attributes
      },
    }
  }
}).call(this);
