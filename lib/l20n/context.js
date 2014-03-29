  'use strict';

  var EventEmitter = require('./events').EventEmitter;
  var Locale = require('./locale').Locale;
  var Parser = require('./parser').Parser;

  function Context(id) {

    this.id = id;
    this.isBuildtime = false;
    this.isReady = false;
    this.isFrozen = false;

    this.supportedLocales = [];
    this.resLinks = [];
    this.locales = {};

    this.get = get;
    this.getEntity = getEntity;

    this.getParser = getParser;
    this.getLocale = getLocale;

    this.requestLocales = requestLocales;

    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;
    this.ready = ready;
    this.once = once;

    this._emitter = new EventEmitter();


    // Getting translations

    function getWithFallback(id) {
      if (!this.isReady) {
        throw new Error('Context not ready');
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
          warn.call(this, new TranslationError('Not found', id,
                                               this.supportedLocales, locale));
          continue;
        }
        return entry;
      }
      error.call(this, new TranslationError('Unable to get translation', id,
                                            this.supportedLocales));
      return null;
    }

    function get(id, ctxdata) {
      var entry = getWithFallback.call(this, id);
      if (entry === null) {
        return null;
      }
      return entry.toString(ctxdata);
    }

    function getEntity(id, ctxdata) {
      var entry = getWithFallback.call(this, id);
      if (entry === null) {
        return null;
      }
      return entry.valueOf(ctxdata);
    }


    // Helpers

    function getParser() {
      if (!this._parser) {
        this._parser = new Parser();
        this._parser._emitter.addEventListener('error', error.bind(this));
      }
      return this._parser;
    }

    function getLocale(code) {
      if (this.locales[code]) {
        return this.locales[code];
      }
      return this.locales[code] = new Locale(code, this);
    }


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

    function requestLocales() {
      if (this.isFrozen && !this.isReady) {
        throw new ContextError('Context not ready');
      }

      this.isFrozen = true;
      var requested = Array.prototype.slice.call(arguments);

      var supported = negotiate(requested.concat('en-US'), requested, 'en-US');
      freeze.call(this, supported);
    }


    // Events

    function addEventListener(type, listener) {
      this._emitter.addEventListener(type, listener);
    }

    function removeEventListener(type, listener) {
      this._emitter.removeEventListener(type, listener);
    }

    function ready(callback) {
      if (this.isReady) {
        setTimeout(callback);
      }
      this.addEventListener('ready', callback);
    }

    function once(callback) {
      /* jshint -W068 */
      if (this.isReady) {
        setTimeout(callback);
      }
      var callAndRemove = (function() {
        this.removeEventListener('ready', callAndRemove);
        callback();
      }).bind(this);
      this.addEventListener('ready', callAndRemove);
    }


    // Errors

    function warn(e) {
      this._emitter.emit('warning', e);
      return e;
    }

    function error(e) {
      this._emitter.emit('error', e);
      return e;
    }
  }

  Context.Error = ContextError;
  Context.TranslationError = TranslationError;

  function ContextError(message) {
    this.name = 'ContextError';
    this.message = message;
  }
  ContextError.prototype = Object.create(Error.prototype);
  ContextError.prototype.constructor = ContextError;

  function TranslationError(message, id, supported, locale) {
    this.name = 'TranslationError';
    this.entity = id;
    this.supportedLocales = supported.slice();
    if (locale) {
      this.locale = locale.id;
      this.message = '[' + this.locale + '] ' + id + ': ' + message + ';';
    } else {
      this.message = id + ': ' + message + '; tried ' + supported.join(', ');
    }
  }
  TranslationError.prototype = Object.create(ContextError.prototype);
  TranslationError.prototype.constructor = TranslationError;

  exports.Context = Context;
