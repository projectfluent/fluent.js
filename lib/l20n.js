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
      var res = this._getObject(mObjects['ast'], aURI);
    },
    __preprocessResource: function(res) {
      var ast = res._ast;
      for(var node in ast.body) {
        if (ast.body[node].type == 'ImportStatement') {
          var path = ast.body[node].uri.content;
          ast.body[node]._ast = null;
          var res = this._getObjectAST(ast.body[node],
                                       path);
        }
      }
    },
    // we should have getValue for value, getAttributes for attributes and get 
    // for both
    get: function(id, args) {
      return mObjects['resources'][id].get(mObjects['resources'],
                                           mObjects['context'],
                                           args)
    },
    getAttributes: function(id, args) {
      var curObj = this._get(id, args);
      return mObjects['system'].getattrs(curObj, mObjects['system'], id);
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
      for (var i = 0; i < mResources.length; i++) {
        if (mResources[i]._loading)
          return false;
      }
      return true;
    },
    onASTReady: function() {
      var compiler = L20n.Compiler;
      var ast = mObjects['ast'];
      compiler.compile(ast, mObjects['resources']);
      this._fireCallbacks(); 
    },
    getAST: function() {
      return {'res': mResources, 'obj': mObjects};
    },
    set onReady(callback) {
      mFrozen = true;
      mEvents['ready'].push(callback);
      if (this.isReady())
        this.onASTReady();
    },
    set data(data) {
      mObjects['context'] = data
    },
    get data() {
      return mObjects['context'];
    },
    _getObject: function(obj, url) {
      var self = this;
      var res = new L20n.Resource(url);
      var _injectResource = function(data) {
        console.log('start injecting')
        var parser = L20n.Parser();
        var ast = parser.parse(data);
        res._ast = ast;
        for (var i in ast.body) {
           obj.push(ast.body[i]);
        }
        res._loading = false;
        if (self.isReady()) {
          self.onASTReady();
        }
      }
      console.log('start loading')
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
