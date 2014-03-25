  'use strict';

  var EventEmitter = require('./events').EventEmitter;
  var Parser = require('./parser').Parser;

  function Context(id) {

    this.id = id;
    this.resLinks = [];
    this.isBuildtime = false;
    this.isReady = false;

    this.requestLocales = requestLocales;

    this.get = get;
    this.getEntity = getEntity;
    this.getLocale = getLocale;
    this.ready = ready;
    this.once = once;

    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;
    this.getParser = getParser;

    this.supportedLocales = [];
    var locales = {};

    this.isFrozen = false;

    this._emitter = new EventEmitter();
    this._parser = null;

    function getParser() {
      if (!this._parser) {
        this._parser = new Parser();
        this._parser._emitter.addEventListener('error', error.bind(this));
      }
      return this._parser;
    }

    function ready(callback) {
      if (this.isReady) {
        setTimeout(callback);
      }
      addEventListener('ready', callback);
    }

    function once(callback) {
      if (this.isReady) {
        setTimeout(callback);
      }
      var callAndRemove = function callAndRemove() {
        removeEventListener('ready', callAndRemove);
        callback();
      };
      addEventListener('ready', callAndRemove);
    }

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
      if (typeof entry === 'string') {
        return entry;
      }
      return entry.getString(ctxdata);
    }

    function getEntity(id, ctxdata) {
      var entry = getWithFallback.call(this, id);
      if (entry === null) {
        return null;
      }
      if (typeof entry === 'string') {
        return entry;
      }
      return entry.get(ctxdata);
    }

    function negotiate(available, requested, defaultLocale) {
      if (available.indexOf(requested[0]) === -1 ||
          requested[0] === defaultLocale) {
        return [defaultLocale];
      } else {
        return [requested[0], defaultLocale];
      }
    }

    function getLocale(code) {
      if (locales[code]) {
        return locales[code];
      }

      var locale = new Locale(code, this);
      locales[code] = locale;
      return locales[code];
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

    function addEventListener(type, listener) {
      this._emitter.addEventListener(type, listener);
    }

    function removeEventListener(type, listener) {
      this._emitter.removeEventListener(type, listener);
    }

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

