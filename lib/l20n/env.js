'use strict';

var Promise = require('rsvp').Promise;
var WeakMap = require('weak-map');
var Set = require('es6-set');

var Context = require('./context').Context;
var EventEmitter = require('./events').EventEmitter;
var io = require('./platform/io');
var parse = require('./parser').parse;

function Env(id) {
  this.id = id;

  this.default = 'i-default';
  this.available = ['i-default'];
  this.supported = ['i-default'];

  this._registered = undefined;
  this._emitter = new EventEmitter();

  this._ctxMap = new WeakMap();
  this._resMap = Object.create(null);
  this._resCache = Object.create(null);
}

Env.prototype.register = function(manifest) {
  // XXX async request to lang pack service to get more available languages
  setTimeout(function() {
    this.default = manifest.default_locale;
    this.available = Object.keys(manifest.locales);
    this._emitter.emit('availablelanguageschange', this.available);
  }.bind(this));
};

Env.prototype.request = function(langs) {
  // XXX this should be a proper language negotiation
  if (this.available.indexOf(langs[0]) === -1 ||
      langs[0] === this.default) {
    this.supported = [this.default];
  } else {
    this.supported = [langs[0], this.default];
  }
};

Env.prototype.require = function(resPaths) {
  var ctx = new Context(this, resPaths);
  // XXX this should be resolved resURIs, without {locale}
  this._ctxMap.set(ctx, resPaths);
  resPaths.forEach(function(resPath) {
    if (!this._resMap[resPath]) {
      this._resMap[resPath] = new Set();
    }
    this._resMap[resPath].add(ctx);
  }, this);
  return ctx;
};

Env.prototype.getResource = function(url, locale, callback) {
  if (this.resources[url] && this.resources[url][locale]) {
    callback();
    return;
  }

  var path = url.replace('{locale}', locale);
  var type = path.substr(path.lastIndexOf('.') + 1);

  switch (type) {
    case 'properties':
      io.load(path, function(err, source) {
        if (!this.resources[url]) {
          this.resources[url] = Object.create(null);
        }
        this.resources[url][locale] = parse(null, source);
        callback();
      }.bind(this));
      break;
  }
};

Env.prototype.addEventListener = function(type, listener) {
  this._emitter.addEventListener(type, listener);
};

Env.prototype.removeEventListener = function(type, listener) {
  this._emitter.removeEventListener(type, listener);
};

// fetch and parse
Env.prototype._getResource = function(resPath) {
  var resCache = this._resCache;
  if (resCache[resPath]) {
    return resCache[resPath];
  }
  return resCache[resPath] = new Promise(function(resolve) {
    setTimeout(function() {
      resolve(resCache[resPath]);
    });
  });
};

exports.Env = Env;
