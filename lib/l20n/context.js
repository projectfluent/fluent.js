  'use strict';

  var EventEmitter = require('./events').EventEmitter;
  var Parser = require('./parser').Parser;

  function Context(id) {

    this.id = id;
    this.resLinks = [];
    this.isBuildtime = false;
    this.isReady = false;

    this.registerLocales = registerLocales;
    this.requestLocales = requestLocales;

    this.get = get;
    this.getEntity = getEntity;
    this.getEntitySource = getEntitySource;
    this.getLocale = getLocale;
    this.ready = ready;
    this.once = once;

    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;
    this.getParser = getParser;

    Object.defineProperty(this, 'supportedLocales', {
      get: function() { return _fallbackChain.slice(); },
      set: function(locs) { _fallbackChain = locs; },
      enumerable: true
    });

    // registered and available languages
    var _default = 'i-default';
    var _registered = [_default];
    var _requested = [];
    var _fallbackChain = [];
    // Locale objects corresponding to the registered languages
    var _locales = {};

    var _isFrozen = false;

    var _emitter = new EventEmitter();
    this._parser = null;


    var self = this;

    function getParser() {
      if (!this._parser) {
        this._parser = new Parser();
        this._parser._emitter.addEventListener('error', error);
      }
      return this._parser;
    }

    function getEntitySource(id) {
      if (!this.isReady) {
        throw new ContextError('Context not ready');
      }
      var cur = 0;
      var loc;
      var locale;
      while (loc = _fallbackChain[cur]) {
        locale = this.getLocale(loc);
        if (!locale.isReady) {
          // build without callback, synchronously
          locale.build(null);
        }
        if (locale.ast && locale.ast.hasOwnProperty(id)) {
          return locale.ast[id];
        }
        warn(new TranslationError('Not found', id, _fallbackChain, locale));
        cur++;
      }
      return '';
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
      if (!self.isReady) {
        throw new Error('Context not ready');
      }
      var cur = 0;
      var loc;
      var locale;
      while (loc = _fallbackChain[cur]) {
        locale = self.getLocale(loc);
        if (!locale.isReady) {
          // build without callback, synchronously
          locale.build(null);
        }
        var entry = locale.getEntry(id);
        if (entry === undefined) {
          cur++;
          warn(new TranslationError('Not found', id, _fallbackChain, locale));
          continue;
        }
        return entry;
      }
      error(new TranslationError('Unable to get translation', id,
            _fallbackChain));
      return null;
    }

    function get(id, ctxdata) {
      var entry = getWithFallback(id);
      if (entry === null) {
        return null;
      }
      if (typeof entry === 'string') {
        return entry;
      }
      return entry.getString(ctxdata);
    }

    function getEntity(id, ctxdata) {
      var entry = getWithFallback(id);
      if (entry === null) {
        return null;
      }
      if (typeof entry === 'string') {
        return {
          value: entry,
          attributes: {}
        };
      }
      return entry.get(ctxdata);
    }

    function registerLocales(defaultLocale, availableLocales) {
      if (defaultLocale === undefined) {
        return;
      }

      _default = defaultLocale;
      _registered = [];

      if (!availableLocales) {
        availableLocales = [];
      }
      availableLocales.push(defaultLocale);

      // uniquify `available` into `_registered`
      availableLocales.forEach(function l10n_ctx_addlocale(locale) {
        if (typeof locale !== 'string') {
          throw new ContextError('Language codes must be strings');
        }
        if (_registered.indexOf(locale) === -1) {
          _registered.push(locale);
        }
      });
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
      if (_locales[code]) {
        return _locales[code];
      }

      var locale = new Locale(code, this);
      _locales[code] = locale;
      return _locales[code];
    }

    function requestLocales() {
      if (_isFrozen && !this.isReady) {
        throw new ContextError('Context not ready');
      }

      if (this.resLinks.length == 0) {
        warn(new ContextError('Context has no resources; not freezing'));
        return;
      }

      _isFrozen = true;
      _requested = Array.prototype.slice.call(arguments);

      if (_requested.length) {
        _requested.forEach(function l10n_throwError(locale) {
          if (typeof locale !== 'string') {
            throw new ContextError('Language codes must be strings');
          }
        });
      }

      var fallbackChain = negotiate(_registered, _requested, _default);
      // if the negotiator returned something, freeze synchronously
      if (fallbackChain) {
        freeze.call(this, fallbackChain);
      }
    }

    function freeze(fallbackChain) {
      var locale = this.getLocale(fallbackChain[0]);
      if (locale.isReady) {
        setReady(fallbackChain);
      } else {
        locale.build(setReady.bind(null, fallbackChain));
      }
    }

    function setReady(fallbackChain) {
      _fallbackChain = fallbackChain;
      self.isReady = true;
      _emitter.emit('ready');
    }

    function addEventListener(type, listener) {
      _emitter.addEventListener(type, listener);
    }

    function removeEventListener(type, listener) {
      _emitter.removeEventListener(type, listener);
    }

    function warn(e) {
      _emitter.emit('warning', e);
      return e;
    }

    function error(e) {
      _emitter.emit('error', e);
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

