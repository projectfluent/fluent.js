'use strict';

var Promise = require('rsvp').Promise;
var Set = require('es6-set');

var Intl = require('./intl').Intl;
var L10nError = require('./errors').L10nError;
var Context = require('./context').Context;
var EventEmitter = require('./events').EventEmitter;
var io = require('./platform/io');
var PropertiesParser = require(
  './format/properties/parser').PropertiesParser;
var debug = require('./debug').debug.bind(null, null);

function Env(id, manifest) {
  this.id = id;

  this.default = 'i-default';
  this.available = [];

  this._parser = new PropertiesParser(this);
  this._emitter = new EventEmitter();

  this._resMap = Object.create(null);
  this._resCache = Object.create(null);

  this.registered = this._register(manifest);
}

Env.prototype.require = function(langs, resIds) {
  var ctx = new Context(this, this._negotiate(langs), resIds);

  resIds.forEach(function(res) {
    if (!this._resMap[res]) {
      this._resMap[res] = new Set();
    }
    this._resMap[res].add(ctx);
  }, this);

  return ctx;
};

Env.prototype.addEventListener = function(type, listener) {
  this._emitter.addEventListener(type, listener);
};

Env.prototype.removeEventListener = function(type, listener) {
  this._emitter.removeEventListener(type, listener);
};


Env.prototype._register = function(manifest) {
  // manifest can be a JSON or a promise
  return Promise.resolve(manifest).then(function(manifest) {
    if (manifest.default_locale) {
      this.default = manifest.default_locale;
    }
    // XXX query the langpack service for more available langs
    if (manifest.locales) {
      this.available = Object.keys(manifest.locales);
    } else {
      this.available = [this.default];
    }
    this._emitter.emit('availablelanguageschange', this.available);
    return this.available;
  }.bind(this));
};

Env.prototype._negotiate = function(langs) {
  return this.registered.then(function() {
    return Promise.resolve(langs);
  }).then(function(requested) {
    return Intl.prioritizeLocales(this.available, requested, this.default);
  }.bind(this));
};

Env.prototype._getResource = function(lang, res) {
  debug('getting resource', res, 'for', lang);
  var cache = this._resCache;
  if (!cache[res]) {
    cache[res] = Object.create(null);
  } else if (cache[res][lang]) {
    debug(res, 'for', lang, 'found in cache; returning');
    return cache[res][lang];
  }

  var url = res.replace('{locale}', lang);
  var type = url.substr(url.lastIndexOf('.') + 1);
  var parse = this._parser.parse.bind(this._parser);

  debug('loading url', url);
  switch (type) {
    case 'properties':
      return cache[res][lang] = io.load(url).then(function(source) {
        debug(url, 'loaded');
        return cache[res][lang] = parse(source);
      }, function(err) {
        debug(url, 'errored with', err);
        // Handle the error but don't propagate it to Promise.all in
        // Context._fetchResources so that Context.ready always fullfills.
        this._emitter.emit('error', err);
        return cache[res][lang] = err;
      }.bind(this));
    default:
      var err = new L10nError('Unknown file type: ' + type);
      debug(url, 'errored with', err);
      return cache[res][lang] = err;
  }
};

exports.Env = Env;
