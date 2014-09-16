'use strict';

var Promise = require('rsvp').Promise;

var L10nError = require('./errors').L10nError;
var EventEmitter = require('./events').EventEmitter;
var debug = require('./debug').debug.bind(null, null);

function Context(env, resIds) {
  this._env = env;
  this._resIds = resIds;

  // XXX maybe use env's emitter to make it even more lightweight?
  this._emitter = new EventEmitter();
}

Context.prototype.ready = function() {
  return this._env.ready.then(this._load.bind(this));
};

Context.prototype.get = function(id, args) {
  return this.ready().then(function(chain) {
    return this._getFallback(chain, id, args);
  }.bind(this));
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
};

Context.prototype.addEventListener = function(type, listener) {
  this._emitter.addEventListener(type, listener);
};

Context.prototype.removeEventListener = function(type, listener) {
  this._emitter.removeEventListener(type, listener);
};


Context.prototype._load = function(supported) {
  return this._fetchResources(supported[0]).then(function() {
    return supported;
  });
};

Context.prototype._fetchResources = function(lang) {
  debug('fetching resources for', lang);
  if (!lang) {
    return Promise.reject(
      new L10nError('No more supported languages to try'));
  }

  return Promise.all(
    this._resIds.map(
      this._env._getResource.bind(this._env, lang)));
};

Context.prototype._getFallback = function(chain, id, args) {
  var lang = chain.shift();
  var entity = this._getEntity(lang, id);

  if (!entity) {
    debug(id, 'missing from', lang);
    return this._fetchResources(chain[0]).then(
      this._getFallback.bind(this, chain, id, args),
      function(err) {
        debug(err);
        // XXX comply to Gaia's l10n.js behavior for now;  return id in the 
        // future
        return null;
      });
  } else {
    debug(id, 'found in', lang);
    // XXX format the entity here, passing ctx and args
    // XXX handle compiler's runtime errors and fall back if needed
    // return entity.format(this, args);
    return entity;
  }
};

Context.prototype._getEntity = function(lang, id) {
  debug('_getEntity', lang, id);
  var cache = this._env._resCache;

  // Look for `id` in every resource in order.
  for (var i = 0, resId; resId = this._resIds[i]; i++) {
    if (cache[resId][lang] instanceof L10nError) {
      continue;
    }
    if (id in cache[resId][lang]) {
      // XXX compile here, passing lang
      // return new Entity(id, cache[resId][lang][id], lang);
      return cache[resId][lang][id];
    }
  }
  return undefined;
};

exports.Context = Context;
