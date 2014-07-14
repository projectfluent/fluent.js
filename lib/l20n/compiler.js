'use strict';

var L10nError = require('./errors').L10nError;

var MAX_PLACEABLE_LENGTH = 2500;
var MAX_PLACEABLES = 100;
var rePlaceables = /\{\{\s*(.+?)\s*\}\}/g;

function Entity(id, node, env) {
  this.id = id;
  this.env = env;
  // the dirty guard prevents cyclic or recursive references from other
  // Entities; see Entity.prototype.resolve
  this.dirty = false;
  if (typeof node === 'string') {
    this.value = node;
  } else {
    // it's either a hash or it has attrs, or both
    var keys = Object.keys(node);

    /* jshint -W084 */
    for (var i = 0, key; key = keys[i]; i++) {
      if (key[0] !== '_') {
        if (!this.attributes) {
          this.attributes = Object.create(null);
        }
        this.attributes[key] = new Entity(this.id + '.' + key, node[key],
                                          env);
      }
    }
    this.value = node._ || null;
    this.index = node._index;
  }
}

Entity.prototype.resolve = function E_resolve(ctxdata) {
  if (this.dirty) {
    return undefined;
  }

  this.dirty = true;
  var val;
  // if resolve fails, we want the exception to bubble up and stop the whole
  // resolving process;  however, we still need to clean up the dirty flag
  try {
    val = resolve(ctxdata, this.env, this.value, this.index);
  } finally {
    this.dirty = false;
  }
  return val;
};

Entity.prototype.toString = function E_toString(ctxdata) {
  try {
    return this.resolve(ctxdata);
  } catch (e) {
    return undefined;
  }
};

Entity.prototype.valueOf = function E_valueOf(ctxdata) {
  if (!this.attributes) {
    return this.toString(ctxdata);
  }

  var entity = {
    value: this.toString(ctxdata),
    attributes: Object.create(null)
  };

  for (var key in this.attributes) {
    /* jshint -W089 */
    entity.attributes[key] = this.attributes[key].toString(ctxdata);
  }

  return entity;
};

function subPlaceable(ctxdata, env, match, id) {
  if (ctxdata && ctxdata.hasOwnProperty(id) &&
      (typeof ctxdata[id] === 'string' ||
       (typeof ctxdata[id] === 'number' && !isNaN(ctxdata[id])))) {
    return ctxdata[id];
  }

  // XXX: special case for Node.js where still:
  // '__proto__' in Object.create(null) => true
  if (id in env && id !== '__proto__') {
    if (!(env[id] instanceof Entity)) {
      env[id] = new Entity(id, env[id], env);
    }
    var value = env[id].resolve(ctxdata);
    if (typeof value === 'string') {
      // prevent Billion Laughs attacks
      if (value.length >= MAX_PLACEABLE_LENGTH) {
        throw new L10nError('Too many characters in placeable (' +
                            value.length + ', max allowed is ' +
                            MAX_PLACEABLE_LENGTH + ')');
      }
      return value;
    }
  }
  return match;
}

function interpolate(ctxdata, env, str) {
  var placeablesCount = 0;
  var value = str.replace(rePlaceables, function(match, id) {
    // prevent Quadratic Blowup attacks
    if (placeablesCount++ >= MAX_PLACEABLES) {
      throw new L10nError('Too many placeables (' + placeablesCount +
                          ', max allowed is ' + MAX_PLACEABLES + ')');
    }
    return subPlaceable(ctxdata, env, match, id);
  });
  placeablesCount = 0;
  return value;
}

function resolve(ctxdata, env, expr, index) {
  if (typeof expr === 'string') {
    return interpolate(ctxdata, env, expr);
  }

  if (typeof expr === 'boolean' ||
      typeof expr === 'number' ||
      !expr) {
    return expr;
  }

  // otherwise, it's a dict

  if (index && ctxdata && ctxdata.hasOwnProperty(index[1])) {
    var argValue = ctxdata[index[1]];

    // special cases for zero, one, two if they are defined on the hash
    if (argValue === 0 && 'zero' in expr) {
      return resolve(ctxdata, env, expr.zero);
    }
    if (argValue === 1 && 'one' in expr) {
      return resolve(ctxdata, env, expr.one);
    }
    if (argValue === 2 && 'two' in expr) {
      return resolve(ctxdata, env, expr.two);
    }

    var selector = env.__plural(argValue);
    if (expr.hasOwnProperty(selector)) {
      return resolve(ctxdata, env, expr[selector]);
    }
  }

  // if there was no index or no selector was found, try 'other'
  if ('other' in expr) {
    return resolve(ctxdata, env, expr.other);
  }

  return undefined;
}

function compile(env, ast) {
  /* jshint -W089 */
  env = env || Object.create(null);
  for (var id in ast) {
    env[id] = new Entity(id, ast[id], env);
  }
  return env;
}

exports.Entity = Entity;
exports.compile = compile;
exports.rePlaceables = rePlaceables;
