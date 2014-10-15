'use strict';

/* jshint -W079 */
var Promise = require('rsvp').Promise;
var Set = require('es6-set');

var Intl = require('./intl').Intl;
var L10nError = require('./errors').L10nError;
var Context = require('./context').Context;
var EventEmitter = require('./events').EventEmitter;
var io = require('./platform/io');
var PropertiesParser = require('./format/properties/parser');
var Resolver = require('./resolver');
var debug = require('./debug').debug;

function Env(id, manifest, requested) {
  this.id = id;

  this.default = 'i-default';
  this.available = [];

  this._emitter = new EventEmitter();

  this._resMap = Object.create(null);
  this._resCache = Object.create(null);
  this._contexts = new Set();

  this.registeredLanguages = this._registerLanguages(manifest);
  this.supportedLanguages = this.registeredLanguages.then(function() {
    var supported = Intl.prioritizeLocales(
      this.available, requested, this.default);
    this._emitter.emit('languagechange', supported);
    return supported;
  }.bind(this));
}

Env.prototype.requestLanguages = function(requested) {
  return this.registeredLanguages.then(function() {
    var supported = Intl.prioritizeLocales(
      this.available, requested, this.default);
    this.supportedLanguages = Promise.resolve(supported);
    this._contexts.forEach(function(ctx) {
      return ctx.reset(supported);
    });
    this._emitter.emit('languagechange', supported);
    return this.supportedLanguages;
  }.bind(this));
};

Env.prototype.createContext = function(resIds) {
  var ctx = new Context(this, resIds);

  resIds.forEach(function(res) {
    if (!this._resMap[res]) {
      this._resMap[res] = new Set();
    }
    this._resMap[res].add(ctx);
  }, this);

  this._contexts.add(ctx);
  return ctx;
};

Env.prototype.addEventListener = function(type, listener) {
  this._emitter.addEventListener(type, listener);
};

Env.prototype.removeEventListener = function(type, listener) {
  this._emitter.removeEventListener(type, listener);
};


Env.prototype._registerLanguages = function(manifest) {
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

  debug('loading url', url);
  switch (type) {
    case 'properties':
      return cache[res][lang] = io.load(url).then(function(source) {
        debug(url, 'loaded');
        var ast = PropertiesParser.parse(null, source);
        cache[res][lang] = Object.create(null);
        for (var i = 0, node; node = ast[i]; i++) {
          cache[res][lang][node.$i] =
            Resolver.createEntry(node, lang);
        }
        return cache[res][lang];
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
