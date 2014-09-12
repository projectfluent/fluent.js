'use strict';

var Promise = require('rsvp').Promise;
var Set = require('es6-set');

var Context = require('./context').Context;
var EventEmitter = require('./events').EventEmitter;
var io = require('./platform/io');
var PropertiesParser = require(
  './format/properties/parser').PropertiesParser;

function Env(id, manifest, userLangs) {
  this.id = id;

  this.default = 'i-default';
  this.available = ['i-default'];
  this.supported = ['i-default'];

  this._parser = new PropertiesParser(this);
  this._emitter = new EventEmitter();

  this._resMap = Object.create(null);
  this._resCache = Object.create(null);

  // XXX I dislike the need to pass the manifest to the constructor, but it's 
  // required here to call register.  I think splitting this into two 
  // functions would be better b/c we don't need to block on the manifest, but
  // it also makes it harder to avoid race conditions between register and 
  // require.  Maybe pass the manifest URL (needs IO..)
  this.ready = this.register(manifest).then(function() {
    return this.request(userLangs);
  }.bind(this));
}

// XXX if we don't register in the constructor above, this should probably 
// take userLangs as the second arg
Env.prototype.register = function(manifest) {
  return new Promise(function(resolve) {
    // XXX async request to the lang pack service to get more available 
    // languages
    setTimeout(function() {
      this.default = manifest.default_locale;
      this.available = Object.keys(manifest.locales);
      this._emitter.emit('availablelanguageschange', this.available);
      resolve(this.available);
    }.bind(this));
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
  this._emitter.emit('languagechange', this.supported);
};

Env.prototype.require = function(resIds) {
  var ctx = new Context(this, resIds);
  resIds.forEach(function(resId) {
    if (!this._resMap[resId]) {
      this._resMap[resId] = new Set();
    }
    this._resMap[resId].add(ctx);
  }, this);
  return ctx;
};

Env.prototype.addEventListener = function(type, listener) {
  this._emitter.addEventListener(type, listener);
};

Env.prototype.removeEventListener = function(type, listener) {
  this._emitter.removeEventListener(type, listener);
};

// fetch and parse
Env.prototype._getResource = function(lang, resId) {
  var resCache = this._resCache;
  if (!resCache[resId]) {
    resCache[resId] = Object.create(null);
  } else if (resCache[resId][lang]) {
    return resCache[resId][lang];
  }

  var url = resId.replace('{locale}', lang);
  var type = url.substr(url.lastIndexOf('.') + 1);

  switch (type) {
    case 'properties':
      return resCache[resId][lang] = io.load(url).then(function(source) {
        resCache[resId][lang] = this._parser.parse(source);
      }.bind(this));
  }
};

exports.Env = Env;
