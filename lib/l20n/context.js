'use strict';

var Promise = require('promise');

var L10nError = require('./errors').L10nError;
var EventEmitter = require('./events').EventEmitter;
var Locale = require('./locale').Locale;
var Resolver = require('./resolver');

function Context(id) {
  this.id = id;
  this.isReady = false;

  this.resLinks = [];
  this.locales = {};

  this._emitter = new EventEmitter();
  this._ready = new Promise(this.once.bind(this));
}


// Getting translations

function reportMissing(id, err) {
  this._emitter.emit('notfounderror', err);
  return id;
}

function getWithFallback(id, langs) {
  /* jshint -W084 */
  var cur = 0;
  var loc;
  var locale;
  while (loc = langs[cur]) {
    locale = this.getLocale(loc);
    if (!locale.isReady) {
      // build without callback, synchronously
      locale.build(null);
    }
    var entry = locale.entries[id];
    if (entry === undefined) {
      cur++;
      reportMissing.call(this, id, new L10nError(
        '"' + id + '"' + ' not found in ' + loc + ' in ' + this.id,
        id, loc));
      continue;
    }
    return entry;
  }

  throw new L10nError(
    '"' + id + '"' + ' missing from all supported locales in ' + this.id, id);
}

function formatTuple(args, entity) {
  try {
    return Resolver.format(args, entity);
  } catch (err) {
    this._emitter.emit('resolveerror', err);
    var locals = {
      error: err
    };
    return [locals, entity.id];
  }
}

function formatValue(args, entity) {
  if (typeof entity === 'string') {
    return entity;
  }

  // take the string value only
  return formatTuple.call(this, args, entity)[1];
}

function formatEntity(args, entity) {
  var rv = formatTuple.call(this, args, entity);
  var locals = rv[0];
  var value = rv[1];

  var formatted = {
    value: value,
    attrs: null,
    overlay: locals.overlay
  };

  if (entity.attrs) {
    formatted.attrs = Object.create(null);
  }

  for (var key in entity.attrs) {
    /* jshint -W089 */
    formatted.attrs[key] = formatValue.call(this, args, entity.attrs[key]);
  }

  return formatted;
}

function formatAsync(fn, langs, id, args) {
  return langs.then(
    getWithFallback.bind(this, id)).then(
      fn.bind(this, args),
      reportMissing.bind(this, id));
}

Context.prototype.formatEntity = function(langs, id, args) {
  return this._ready.then(
    formatAsync.bind(this, formatEntity, langs, id, args));
};

Context.prototype.getLocale = function getLocale(code) {
  /* jshint -W093 */

  var locales = this.locales;
  if (locales[code]) {
    return locales[code];
  }

  return locales[code] = new Locale(code, this);
};


// Getting ready

Context.prototype.fetch = function(langs) {
  return langs.then(function(supported) {
    var locale = this.getLocale(supported[0]);
    if (locale.isReady) {
      this.setReady(supported);
    } else {
      locale.build(this.setReady.bind(this));
    }
  }.bind(this));
};

Context.prototype.setReady = function() {
  this.isReady = true;
  this._emitter.emit('ready');
};

// Events

Context.prototype.addEventListener = function(type, listener) {
  this._emitter.addEventListener(type, listener);
};

Context.prototype.removeEventListener = function(type, listener) {
  this._emitter.removeEventListener(type, listener);
};

Context.prototype.ready = function(callback) {
  if (this.isReady) {
    setTimeout(callback);
  }
  this.addEventListener('ready', callback);
};

Context.prototype.once = function(callback) {
  /* jshint -W068 */
  if (this.isReady) {
    setTimeout(callback);
    return;
  }

  var callAndRemove = (function() {
    this.removeEventListener('ready', callAndRemove);
    callback();
  }).bind(this);
  this.addEventListener('ready', callAndRemove);
};

exports.Context = Context;
