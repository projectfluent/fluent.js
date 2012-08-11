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

  let mObjects = {
    'ast': [],
    'resources': {}, // resource entities
    'context': {}, // context letiables
    'globals': {}, // global letiables
  }

  return {
    addResource: function(aURI) {
      let res = this._getObject(aURI, function(ast) {
        for (let i in ast.body) {
          mObjects['ast'].push(ast.body[i])
        }
      });
    },
    __preprocessAST: function(ast) {
      for(let node in ast) {
        if (ast[node].type == 'ImportStatement') {
          let path = ast[node].uri.content;
          let self=this;
          let t = function() {
            let num = node;
            self._getObject(path, function(subAst) {
              ast.splice(num, 1)
              for (let i in subAst.body) {
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
      if (!args)
        args = {}
      args.__proto__ = mObjects['context'];
      return mObjects['resources'][id].get(mObjects['resources'],
                                           args)
    },
    getAttribute: function(id, args) {
      let curObj = this._get(id, args);
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
      for (let i in mResources)
        if (mResources[i]._loading)
          return false;
      return true;
    },
    onASTReady: function() {
      if (mCompiled)
        return
      let ast = mObjects['ast'];
      if (!mPreprocessed) {
        this.__preprocessAST(ast);
      } else {
        let compiler = L20n.Compiler;
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
      let self = this;
      let res = new L20n.Resource(url);
      let _injectResource = function(data) {
        let parser = L20n.Parser();
        let ast = parser.parse(data);
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
