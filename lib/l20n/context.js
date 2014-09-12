'use strict';

var Promise = require('rsvp').Promise;
var EventEmitter = require('./events').EventEmitter;

function Context(env, resIds) {
  this._env = env;
  this._resIds = resIds;

  this._locales = Object.create(null);
  this._emitter = new EventEmitter();

  this.ready = env.ready.then(function() {
    return Promise.all(
      resIds.map(env._getResource.bind(env, env.supported[0])));
  });
}

Context.prototype.get = function(id, args) {
  return this.ready.then(function() {
    return new Promise(function(resolve) {
      resolve('this is ' + id + JSON.stringify(args));
    });
  });
};

Context.prototype.destroy = function() {
  var env = this._env;
  env._ctxMap.get(this).forEach(function(resId) {
    if (env._resMap[resId].size === 1) {
      env._resMap[resId].clear();
      delete env._resCache[resId];
    } else {
      env._resMap[resId].delete(this);
    }
  }, this);
  env._ctxMap.delete(this);
};

Context.prototype.addEventListener = function(type, listener) {
  this._emitter.addEventListener(type, listener);
};

Context.prototype.removeEventListener = function(type, listener) {
  this._emitter.removeEventListener(type, listener);
};

exports.Context = Context;
