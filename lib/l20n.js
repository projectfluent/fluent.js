var L20n = {
  getContext: function() {
    return new this.Context();
  },
  _startLoading: function(res, callback) {
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType('text/plain');
    xhr.addEventListener("load", function() {
      return callback(xhr.responseText)
    });
    xhr.open('GET', res.uri, true);
    xhr.send('');
  }
}

L20n.Resource = function(aURI) {
  this.uri = aURI;
}

L20n.Resource.prototype = {
  _loading: true,
  _ast: null,
  uri: null,
}

L20n.Context = function() {
  var mFrozen = false;
  var mCompiled = false;
  var mPreprocessed = false;
  var mResources = {}; // resource files
  var mEvents = {'ready': []}

  var mObjects = {
    'ast': [],
    'resources': {}, // resource entities
    'context': {}, // context variables
    'globals': {}, // global variables
  }

  return {
    addResource: function(aURI) {
      var res = this._getObject(aURI, function(ast) {
        for (var i in ast.body) {
          mObjects['ast'].push(ast.body[i])
        }
      });
    },
    __preprocessAST: function(ast) {
      for(var node in ast) {
        if (ast[node].type == 'ImportStatement') {
          var path = ast[node].uri.content;
          var self=this;
          var t = function() {
            var num = node;
            self._getObject(path, function(subAst) {
              ast.splice(num, 1)
              for (var i in subAst.body) {
                ast.splice(parseInt(num)+parseInt(i), 0, subAst.body[i])
              }
            });
          }()
        }
      }
      mPreprocessed = true;
    },
    get: function(id, args) {
      if (!this.isReady())
        throw "Error"
      if (!mObjects['resources'][id])
        throw "No such entity: "+id
      args.__proto__ = mObjects['context'];
      return mObjects['resources'][id].get(mObjects['resources'],
                                           args)
    },
    getAttribute: function(id, args) {
      var curObj = this._get(id, args);
      return mObjects['system'].getattrs(curObj, mObjects['system'], id);
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
      var ast = mObjects['ast'];
      if (!mPreprocessed) {
        this.__preprocessAST(ast);
      } else {
        var compiler = L20n.Compiler;
        compiler.compile(ast, mObjects['resources']);
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
      mObjects['context'] = data
    },
    get data() {
      return mObjects['context'];
    },
    _getObject: function(url, callback) {
      var self = this;
      var res = new L20n.Resource(url);
      var _injectResource = function(data) {
        var parser = L20n.Parser();
        var ast = parser.parse(data);
        res._ast = ast;
        res._loading = false;
        callback(ast);
        if (self.isReady()) {
          self.onASTReady();
        }
      }
      L20n._startLoading(res, _injectResource);
      mResources[url] = res;
    },
    _fireCallbacks: function() {
      if (mEvents['ready'].length) {
        for (var i in mEvents['ready'])
          mEvents['ready'][i]();
        mEvents['ready'] = [];
      }
    }
  }
}
