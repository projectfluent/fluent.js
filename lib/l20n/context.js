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

  this.ready = env.ready.then(function() {
    this._fetchResources(0);
    this._env._emitter.addEventListener(
      'languagechange', function(supported) {
      debug('languagechange!', supported.join(', '));
      this.ready = this._fetchResources(0);
    }.bind(this));
  }.bind(this));
}

Context.prototype.get = function(id, args) {
  return this.ready.then(function() {
    return this._getFallback(0, id, args);
  }.bind(this));
};

Context.prototype._fetchResources = function(cur) {
  debug('fetching resources for supported lang #', cur);
  var lang = this._env.supported[cur];
  if (!lang) {
    return Promise.reject(
      new L10nError('No more supported languages to try'));
  }

  return Promise.all(
    this._resIds.map(
      this._env._getResource.bind(this._env, lang)));
};

Context.prototype._getFallback = function(cur, id, args) {
  var entity = this._env._getEntity(
    this._env.supported[cur], this._resIds, id);
  if (!entity) {
    debug(id, 'missing from supported lang #', cur);
    return this._fetchResources(cur + 1).then(
      this._getFallback.bind(this, cur + 1, id, args),
      function(err) {
        debug(err);
        return id;
      });
  } else {
    debug(id, 'found in supported lang #', cur);
    // XXX format the entity here, passing ctx and args
    // XXX handle compiler's runtime errors and fall back if needed
    // return entity.format(this, args);
    return entity;
  }
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

exports.Context = Context;
