
var L20n = {
  xul: {},
  cache: {},
  getContext: function(id) {
    return new L20n.Context(this.xul[id], this.cache)
  },
  hasContext: function(id) {
    return this.xul[id]?true:false;
  },
  createContext: function(id) {
    this.xul[id] = {'l20n': {}, 'data': {}};
    return new L20n.Context(this.xul[id], this.cache);
  },
}

L20n.Context = function(obj, cache) {
  this.obj = obj;
  this.curObj = this.obj['l20n'];
  this.cache = cache;
}

L20n.Context.prototype = {
  _getEntity: function(id, params) {
    var localObj;
    if (params) {
      localObj = {};
      for (var i in params) {
        localObj[i] = params[i];
      }
      localObj.__proto__ = this.curObj;
    } else {
      localObj = this.curObj;
    }
    return [localObj[id], localObj]; 
  },
  get: function(id, params) {
    let [entity, localObj] = this._getEntity(id, params);
    return localObj.getent(localObj, id)
  },
  getAttributes: function(id, params) {
    let attrs = {};
    let [entity, localObj] = this._getEntity(id, params);
    for (let i in entity._attrs) {
      if (typeof(entity._attrs[i])=='function') {
        attrs[i] = entity._attrs[i](localObj);
      } else {
        attrs[i] = entity._attrs[i];
      }
    }
    return attrs;
  },
  addReference: function(uri) {
 	var read = function(data) {
 	  eval(data);
 	}

    if (!this.cache[uri]) {
      var data = this._get_file(uri);
      this.cache[uri] = {}
      read.apply(this.cache[uri], Array(data))
    }
    var i;
    for (i in this.cache[uri]) {
      this.obj['l20n'][i] = this.cache[uri][i];
    }
  },
  set data(val) {
    this.obj['data'] = val;
    this.obj['data'].__proto__ = this.obj['l20n'];
    this.curObj = this.obj['data'];
  }
}

