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
  uri: null,
}

L20n.Context = function() {
  mFrozen = false;
  mResources = [];
  mEvents = {'ready': []}

  mObjects = {
    'resources': {},
    'context': {},
    'globals': {},
  }

}

L20n.Context.prototype = {
  addResource: function(aURI) {
    var res = this._getObject(mObjects['resources'], aURI);
  },
  get: function(id, args) {
    return mObjects['resources'][id](); 
    var curObj = this._get(id, args);
    return mObjects['system'].getent(curObj, mObjects['system'], id);
  },
  getAttributes: function(id, args) {
    var curObj = this._get(id, args);
    return mObjects['system'].getattrs(curObj, mObjects['system'], id);
  },
  isFrozen: function() {
    return mFrozen; 
  },
  freeze: function() {
    mFrozen = true;
    if (this.isReady()) {
      this._fireCallback();
    }
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
  set onReady(callback) {
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
    var ast = Parser.parse(data);
    Compiler.compile(ast, obj);
    //new Function(data).call(obj);
  },
  _getObject: function(obj, url) {
    var self = this;
    var res = new L20n.Resource(url);
    var _injectResource = function(data) {
      self._loadObject(data, obj);
      res._loading = false;
      if (self.isReady()) {
        self._fireCallback();
      }
    }
    L20n._startLoading(res, _injectResource);
    mResources.push(res);
  },
  _fireCallback: function() {
    if (mEvents['ready'].length) {
      for (var i in mEvents['ready'])
        mEvents['ready'][i]();
      mEvents['ready'] = [];
    }
  }
}

