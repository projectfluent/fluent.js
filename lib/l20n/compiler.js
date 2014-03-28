  'use strict';

  var MAX_PLACEABLE_LENGTH = 2500;
  var MAX_PLACEABLES = 100;
  var rePlaceables = /\{\{\s*(.+?)\s*\}\}/g;

  function Entity(id, node, env) {
    this.id = id;
    this.env = env;
    this.dirty = false;
    if (typeof node === 'string') {
      this.value = node;
    } else {
      // it's either a hash or it has attrs, or both
      for (var key in node) {
        if (node.hasOwnProperty(key) && key[0] !== '_') {
          if (!this.attributes) {
            this.attributes = {};
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
      val = resolve(this.value, this.env, ctxdata || {}, this.index);
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
      attributes: {}
    };
    for (var key in this.attributes) {
      if (this.attributes.hasOwnProperty(key)) {
        entity.attributes[key] = this.attributes[key].toString(ctxdata);
      }
    }
    return entity;
  };

  function subPlaceable(env, ctxdata, match, id) {
    if (ctxdata && ctxdata.hasOwnProperty(id) &&
        (typeof ctxdata[id] === 'string' ||
         (typeof ctxdata[id] === 'number' && !isNaN(ctxdata[id])))) {
      return ctxdata[id];
    }
    if (env.hasOwnProperty(id)) {
      var value;
      if (env[id].resolve) {
        value = env[id].resolve(ctxdata);
      } else {
        value = env[id];
      }
      if (typeof value === 'string') {
        if (value.length >= MAX_PLACEABLE_LENGTH) {
          throw new Error('Too many characters');
        }
        return value;
      }
    }
    return match;
  }

  function interpolate(str, env, ctxdata) {
    var placeables_count = 0;
    var value = str.replace(rePlaceables, function(match, id) {
      if (placeables_count++ >= MAX_PLACEABLES) {
        throw new Error('Too many placeables');
      }
      return subPlaceable(env, ctxdata, match, id);
    });
    placeables_count = 0;
    return value;
  }

  function resolve(expr, env, ctxdata, index) {
    if (typeof expr === 'string') {
      return interpolate(expr, env, ctxdata);
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
        return resolve(expr.zero, env, ctxdata);
      }
      if (argValue === 1 && 'one' in expr) {
        return resolve(expr.one, env, ctxdata);
      }
      if (argValue === 2 && 'two' in expr) {
        return resolve(expr.two, env, ctxdata);
      }

      var selector = env.__plural(argValue);
      if (expr.hasOwnProperty(selector)) {
        return resolve(expr[selector], env, ctxdata);
      }
    }

    // if there was no index or no selector was found, try 'other'
    if ('other' in expr) {
      return resolve(expr.other, env, ctxdata);
    }

    return undefined;
  }

  function compile(ast, env) {
    /* jshint -W089 */
    if (!env) {
      env = {};
    }

    for (var id in ast) {
      if (!ast.hasOwnProperty(id)) {
        continue;
      }
      if (typeof ast[id] === 'string' && !(rePlaceables.test(ast[id]))) {
        env[id] = ast[id];
      } else {
        env[id] = new Entity(id, ast[id], env);
      }
      // reset the regexp
      rePlaceables.lastIndex = 0;
    }
    return env;
  }

  exports.compile = compile;
  exports.rePlaceables = rePlaceables;
