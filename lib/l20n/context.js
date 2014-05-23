'use strict';

var L10nError = require('./errors').L10nError;
var EventEmitter = require('./events').EventEmitter;
var Locale = require('./locale').Locale;

function Context(id) {

  this.id = id;
  this.isReady = false;
  this.isLoading = false;

  this.supportedLocales = [];
  this.resLinks = [];
  this.locales = {};

  this._emitter = new EventEmitter();


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

  this.get = function get(id, ctxdata) {
    var entry = getWithFallback.call(this, id);
    if (entry === null) {
      return '';
    }

    return entry.toString(ctxdata) || '';
  };

  this.getEntity = function getEntity(id, ctxdata) {
    var entry = getWithFallback.call(this, id);
    if (entry === null) {
      return null;
    }

    return entry.valueOf(ctxdata);
  };


  // Helpers

  this.getLocale = function getLocale(code) {
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

  this.requestLocales = function requestLocales() {
    if (this.isLoading && !this.isReady) {
      throw new L10nError('Context not ready');
    }

    this.isLoading = true;
    var requested = Array.prototype.slice.call(arguments);

    var supported = negotiate(requested.concat('en-US'), requested, 'en-US');
    freeze.call(this, supported);
  };


  // Events

  this.addEventListener = function addEventListener(type, listener) {
    this._emitter.addEventListener(type, listener);
  };

  this.removeEventListener = function removeEventListener(type, listener) {
    this._emitter.removeEventListener(type, listener);
  };

  this.ready = function ready(callback) {
    if (this.isReady) {
      setTimeout(callback);
    }
    this.addEventListener('ready', callback);
  };

  this.once = function once(callback) {
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
}

exports.Context = Context;
