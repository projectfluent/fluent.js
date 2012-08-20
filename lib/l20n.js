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

  function _startLoading(res, callback) {
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType('text/plain');
    xhr.addEventListener("load", function() {
      return callback(xhr.responseText)
    });
    xhr.open('GET', res.uri, true);
    xhr.send('');
  };

  function Resource(aURI) {
    this.uri = aURI;
  }

  Resource.prototype = {
    _loading: true,
    _ast: null,
    uri: null,
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

    return {
      addResource: function(aURI) {
        var res = this._getObject(aURI, function(ast) {
          mObjects['ast'] = mObjects['ast'].concat(ast.body)
        });
      },
      __preprocessAST: function(ast) {
        var self=this;
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
      },
      _getArgs: function(data) {
        var args = Object.create(mObjects['ctxdata'])
        if (data) {
          for (var i in data) {
            args[i] = data[i]
          }
        }
        return args
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
      get: function(id, data, callback, fallback) {
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
      getEntity: function() {
      },
      isFrozen: function() {
        return mFrozen; 
      },
      isCompiled: function() {
        return mCompiled;
      },
      isReady: function() {
        if (!mFrozen)
          return false;
        for (var i in mResources)
          if (mResources[i]._loading)
            return false;
        return true;
      },
      onASTReady: function() {
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
      },
      getAST: function() {
        return {'res': mResources, 'obj': mObjects};
      },
      set onReady(callback) {
        mFrozen = true;
        mEvents['ready'].push(callback);
        if (this.isReady()) {
          this.onASTReady();
        }
      },
      set data(data) {
        mObjects['ctxdata'] = data
      },
      get data() {
        return mObjects['ctxdata'];
      },
      _getObject: function(url, callback) {
        var self = this;
        var res = new Resource(url);
        var _injectResource = function(data) {
          var ast = L20n.Parser.parse(data);
          res._ast = ast;
          res._loading = false;
          callback(ast);
          if (self.isReady()) {
            self.onASTReady();
          }
        }
        _startLoading(res, _injectResource);
        mResources[url] = res;
      },
      _fireCallbacks: function() {
        if (mEvents['ready'].length) {
          for (var i in mEvents['ready'])
            mEvents['ready'][i](this);
          mEvents['ready'] = [];
        }
      }
    }
  }
}).call(this);
