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
  var mResources = {}; // resource files
  var mEvents = {'ready': []}

  var mObjects = {
    'asts': {},
    'resources': {}, // resource entities
    'context': {}, // context variables
    'globals': {}, // global variables
  }

  return {
    addResource: function(aURI) {
      console.log('-- addResource for: '+aURI);
      //console.log(mResources);
      var res = this._getObject(mObjects['resources'], aURI);
    },
    __addResourceAST: function(aURI) {
      console.log('-- addResourceAST for: '+aURI);
      if (!(aURI in mObjects['asts']))
        mObjects['asts'][aURI] = {'_ast': null}
      var res = this._getObjectAST(mObjects['asts'][aURI], aURI);
    },
    __preprocessResource: function(res) {
      console.log('-- preprocessResource')
      var ast = res._ast;
      for(var node in ast.body) {
        if (ast.body[node].type == 'ImportStatement') {
          var path = ast.body[node].uri.content;
          console.log('--- Import: '+path);
          ast.body[node]._ast = null;
          var res = this._getObjectAST(ast.body[node],
                                       path);
        }
      }
    },
    // we should have getValue for value, getAttributes for attributes and get 
    // for both
    get: function(id, args) {
      return mObjects['resources'][id](); 
      var curObj = this._get(id, args);
      return mObjects['system'].getent(curObj, mObjects['system'], id);
    },
    getAttributes: function(id, args) {
      return {}; // skip the attributes for now
      var curObj = this._get(id, args);
      return mObjects['system'].getattrs(curObj, mObjects['system'], id);
    },
    isFrozen: function() {
      return mFrozen; 
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
    getAST: function() {
      return {'res': mResources, 'obj': mObjects};
    },
    set onReady(callback) {
      console.log('-- setting onReady')
      console.log('isReady: '+this.isReady())
      mFrozen = true;
      if (!this.isReady())
        mEvents['ready'].push(callback);
      else
        callback();
    },
    set data(data) {
      mObjects['context'] = data
    },
    get data() {
      return mObjects['context'];
    },

    // Private
    _get: function(id, args) {
      var curObj = mObjects['resources'];
      if (mObjects['context']) {
        mObjects['context'].__proto__ = curObj;
        curObj = mObjects['context'];
      }
      if (args) {
        args.__proto__ = curObj;
        curObj = args;
      }
      mObjects['globals'].__proto__ = curObj;
      return mObjects['globals'];
    },
    _loadObject: function(data, obj) {
      //var ast = Parser.parse(data);
      //Compiler.compile(ast, obj);
      //new Function(data).call(obj);
    },
    _getObject: function(obj, url) {
      console.log('-- __getObject for '+url);
      var self = this;
      if (url in mResources)
        return mResources[url];
      var res = new L20n.Resource(url);
      var _injectResource = function(data) {
        console.log('-- injectResource: '+url);
        self._loadObject(data, obj);
        res._loading = false;
        if (self.isReady()) {
          self._fireCallback();
        }
      }
      L20n._startLoading(res, _injectResource);
      mResources[url] = res;
      return res;
    },
    _getObjectAST: function(obj, url) {
      console.log('-- __getObjectAST for '+url);
      var self = this;
      if (url in mResources)
        return mResources[url];
      var res = new L20n.Resource(url);
      var _injectResource = function(data) {
        console.log('-- injectResourceAST: '+url);
        res._ast = asts[url];
        obj._ast = asts[url];
        self.__preprocessResource(res);
        res._loading = false;
        if (self.isReady()) {
          self._fireCallback();
        }
      }
      _injectResource();
      mResources[url] = res;
      return res;
    },
    _fireCallback: function() {
      if (mEvents['ready'].length) {
        for (var i in mEvents['ready'])
          mEvents['ready'][i]();
        mEvents['ready'] = [];
      }
    }
  }
}
