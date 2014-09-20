'use strict';

var Promise = require('rsvp').Promise;

var Entity = require('./compiler').Entity;
var getPluralRule = require('./plurals').getPluralRule;
var L10nError = require('./errors').L10nError;
var debug = require('./debug').debug;

function Context(env, resIds) {
  this._env = env;
  this._resIds = resIds;

  this.ready = env.supported.then(this._fetchResources.bind(this));
}

Context.prototype.reset = function(supported) {
  this.ready = this._fetchResources(supported);
};

Context.prototype.format = function(id, args) {
  return this.ready.then(this._fallback.bind(this, 'format', id, args));
};

Context.prototype.get = function(id, args) {
  return this.ready.then(this._fallback.bind(this, 'get', id, args));
};

Context.prototype.destroy = function() {
  var env = this._env;
  this._resIds.forEach(function(resId) {
    if (env._resMap[resId].size === 1) {
      env._resMap[resId].clear();
      delete env._resCache[resId];
    } else {
      env._resMap[resId].delete(this);
    }
  }, this);
  env._contexts.delete(this);
};

Context.prototype._fetchResources = function(supported) {
  debug('fetching resources for', supported.join(', '));

  if (supported.length === 0) {
    return Promise.reject(
      new L10nError('No more supported languages to try'));
  }

  return Promise.all(
    this._resIds.map(
      this._env._getResource.bind(this._env, supported[0]))).then(
        function() {
          return supported;
        });
};

Context.prototype._fallback = function(method, id, args, supported) {
  var lang = supported[0];
  var entity = this._getEntity(lang, id);

  if (entity) {
    debug(id, 'found in', lang);
    try {
      return entity[method](this, args);
    } catch (e) {
      debug(id, 'in', lang, 'is broken:', e);
    }
  } else {
    debug(id, 'missing from', lang);
  }

  return this._fetchResources(supported.slice(1)).then(
    this._fallback.bind(this, method, id, args),
    function(err) {
      debug(err);
      return id;
    });
};

Context.prototype._getEntity = function(lang, id) {
  var cache = this._env._resCache;

  // Look for `id` in every resource in order.
  for (var i = 0, resId; resId = this._resIds[i]; i++) {
    var resource = cache[resId][lang];
    if (resource instanceof L10nError) {
      continue;
    }
    if (id in resource) {
      if (resource[id] instanceof Entity) {
        return resource[id];
      }
      return resource[id] = new Entity(id, resource[id], lang);
    }
  }
  return undefined;
};

// XXX in the future macros will be stored in localization resources together 
// with regular entities and this method will not be needed anymore
Context.prototype._getMacro = function(lang, id) {
  switch(id) {
    case 'plural':
      return getPluralRule(lang);
    default:
      return undefined;
  }
};

exports.Context = Context;
