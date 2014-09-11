'use strict';

var Promise = require('rsvp').Promise;
var EventEmitter = require('./events').EventEmitter;

function Context(env, resPaths) {
  this._env = env;
  this._resPaths = resPaths;

  this._locales = Object.create(null);
  this._emitter = new EventEmitter();

  this.loaded = Promise.all(resPaths.map(env._getResource.bind(env)));
}

Context.prototype.get = function(id, args) {
  return this.loaded.then(function() {
    return new Promise(function(resolve) {
      resolve('this is ' + id + JSON.stringify(args));
    });
  });
};

Context.prototype.destroy = function() {
  var env = this._env;
  env._ctxMap.get(this).forEach(function(resPath) {
    if (env._resMap[resPath].size === 1) {
      env._resMap[resPath].clear();
      delete env._resCache[resPath];
    } else {
      env._resMap[resPath].delete(this);
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
