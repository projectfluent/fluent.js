'use strict';

var L10nError = require('./errors').L10nError;
var EventEmitter = require('./events').EventEmitter;
var Locale = require('./locale').Locale;
var PSEUDO_STRATEGIES = require('./pseudo').PSEUDO_STRATEGIES;

function Context(id) {
  this.id = id;
  this.isReady = false;
  this.isLoading = false;

  this.defaultLocale = 'en-US';
  this.availableLocales = [];
  this.supportedLocales = [];

  this.resLinks = [];
  this.locales = {};

  this._emitter = new EventEmitter();
}


// Getting translations

function getWithFallback(id) {
  /* jshint -W084 */

  if (!this.isReady) {
    throw new L10nError('Context not ready');
  }

  var cur = 0;
  var loc;
  var locale;
  while (loc = this.supportedLocales[cur]) {
    locale = this.getLocale(loc);
    if (!locale.isReady) {
      // build without callback, synchronously
      locale.build(null);
    }
    var entry = locale.getEntry(id);
    if (entry === undefined) {
      cur++;
      warning.call(this, new L10nError(id + ' not found in ' + loc, id,
                                       loc));
      continue;
    }
    return entry;
  }

  error.call(this, new L10nError(id + ' not found', id));
  return null;
}

Context.prototype.get = function(id, ctxdata) {
  var entry = getWithFallback.call(this, id);
  if (entry === null) {
    return '';
  }

  return entry.toString(ctxdata) || '';
};

Context.prototype.getEntity = function(id, ctxdata) {
  var entry = getWithFallback.call(this, id);
  if (entry === null) {
    return null;
  }

  return entry.valueOf(ctxdata);
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

function negotiate(available, requested, defaultLocale) {
  if (available.indexOf(requested[0]) === -1 ||
      requested[0] === defaultLocale) {
    return [defaultLocale];
  } else {
    return [requested[0], defaultLocale];
  }
}

function freeze(supported) {
  var locale = this.getLocale(supported[0]);
  if (locale.isReady) {
    setReady.call(this, supported);
  } else {
    locale.build(setReady.bind(this, supported));
  }
}

function setReady(supported) {
  this.supportedLocales = supported;
  this.isReady = true;
  this._emitter.emit('ready');
}

Context.prototype.registerLocales = function(defLocale, available) {
  /* jshint boss:true */
  this.availableLocales = [this.defaultLocale = defLocale];

  if (available) {
    for (var i = 0, loc; loc = available[i]; i++) {
      if (this.availableLocales.indexOf(loc) === -1) {
        this.availableLocales.push(loc);
      }
    }
  }
};

Context.prototype.requestLocales = function requestLocales() {
  if (this.isLoading && !this.isReady) {
    throw new L10nError('Context not ready');
  }

  this.isLoading = true;
  var requested = Array.prototype.slice.call(arguments);
  if (requested.length === 0) {
    throw new L10nError('No locales requested');
  }

  var reqPseudo = requested.filter(function(loc) {
    return loc in PSEUDO_STRATEGIES;
  });

  var supported = negotiate(this.availableLocales.concat(reqPseudo),
                            requested,
                            this.defaultLocale);
  freeze.call(this, supported);
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


// Errors

function warning(e) {
  this._emitter.emit('warning', e);
  return e;
}

function error(e) {
  this._emitter.emit('error', e);
  return e;
}

exports.Context = Context;
