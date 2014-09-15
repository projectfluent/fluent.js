'use strict';

var Promise = require('rsvp').Promise;
var Set = require('es6-set');

var L10nError = require('./errors').L10nError;
var Context = require('./context').Context;
var EventEmitter = require('./events').EventEmitter;
var io = require('./platform/io');
var PropertiesParser = require(
  './format/properties/parser').PropertiesParser;
var debug = require('./debug').debug.bind(null, null);

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

// fetch and parse
Env.prototype._getResource = function(lang, res) {
  debug('getting resource', res, 'for', lang);
  var cache = this._resCache;
  if (!cache[res]) {
    debug(res, 'not in cache; creating empty object');
    cache[res] = Object.create(null);
  } else if (cache[res][lang]) {
    debug(res, 'found in cache; returning');
    return cache[res][lang];
  }

  var url = res.replace('{locale}', lang);
  var type = url.substr(url.lastIndexOf('.') + 1);
  var parse = this._parser.parse.bind(this._parser);

  debug('loading url', url, 'of type', type);
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

Env.prototype._getEntity = function(lang, resIds, id) {
  if (!lang) {
    return undefined;
  }

  // Look for `id` in every resource in order.
  for (var i = 0, resId; resId = resIds[i]; i++) {
    if (this._resCache[resId][lang] instanceof L10nError) {
      continue;
    }
    if (id in this._resCache[resId][lang]) {
      // XXX compile here, passing lang
      // return this._compiler.compile(
      //   lang, this._resCache[resId][lang][id]);
      return this._resCache[resId][lang][id];
    }
  }
  return undefined;
};

exports.Env = Env;
