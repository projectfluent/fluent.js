'use strict'
let L20n = {
  getContext: function() {
    return new this.Context();
  },
  _startLoading: function(res, callback) {
    let xhr = new XMLHttpRequest();
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
  let mFrozen = false;
  let mCompiled = false;
  let mPreprocessed = false;
  let mResources = {}; // resource files
  let mEvents = {'ready': []}
  let mParser = new L20n.Parser();

  let mObjects = {
    'ast': [],
    'resources': {}, // resource entities
    'context': {}, // context letiables
    'globals': {}, // global letiables
  }

  return {
    addResource: function(aURI) {
      let res = this._getObject(aURI, function(ast) {
        mObjects['ast'] = mObjects['ast'].concat(ast.body)
      });
    },
    __preprocessAST: function(ast) {
      let self=this;
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
    get: function(id, args) {
      if (!mCompiled)
        throw "Error"
      let entity = null;
      try {
        entity = mObjects['resources'][id]
      } catch(e) {
        throw "No such entity: "+id
      }
      if (entity.local)
        throw "This entity is local"
      if (!args)
        args = {}
      args.__proto__ = mObjects['context'];
      return entity.get(mObjects['resources'], args)
    },
    getAttribute: function(id, attr, args) {
      if (!mCompiled)
        throw "Error"
      let entity = null;
      try {
        entity = mObjects['resources'][id]
      } catch(e) {
        throw "No such entity: "+id
      }
      if (entity.local)
        throw "This entity is local"
      if (!args)
        args = {}
      args.__proto__ = mObjects['context'];
      if (entity.attributes[attr].local)
        throw "This attribute is local"
      return entity.getAttribute(attr, mObjects['resources'], args)
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
      for (let i in mResources)
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
                              mObjects['resources']);
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
      let self = this;
      let res = new L20n.Resource(url);
      let _injectResource = function(data) {
        let ast = mParser.parse(data);
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
        for (let i in mEvents['ready'])
          mEvents['ready'][i](this);
        mEvents['ready'] = [];
      }
    }
  }
}
