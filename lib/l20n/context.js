  'use strict';

  var EventEmitter = require('./events').EventEmitter;
  var Parser = require('./parser').Parser;
  var Compiler = require('./compiler').Compiler;
  var io = require('./platform/io');
  var getPluralRule = require('./plurals').getPluralRule;

  function Resource(id, parser) {
    this.id = id;
    this.parser = parser;

    this.resources = [];
    this.source = null;
    this.ast = null;
  }

  Resource.prototype.build = function R_build(callback, sync) {
    if (this.source) {
      this.parse(callback);
    } else if (this.ast) {
      callback();
    } else {
      io.load(this.id, this.parse.bind(this, callback), sync);
    }
  };

  Resource.prototype.parse = function R_parse(callback, err, text) {
    if (err) {
      this.ast = {
        type: 'WebL10n',
        body: {}
      };
      return callback(err);
    } else if (text === undefined) {
      this.ast = this.parser.parse(this.source);
    } else {
      if (/\.json/.test(this.id)) {
        // JSON is guaranteed to be an AST
        this.ast = JSON.parse(text);
      } else {
        this.source = text;
        this.ast = this.parser.parse(this.source);
      }
    }
    callback();
  };

  function Locale(id, parser, compiler, emitter) {
    this.id = id;
    this.parser = parser;
    this.compiler = compiler;
    this.emitter = emitter;

    this.resources = [];
    this.entries = null;
    this.ast = {
      type: 'WebL10n',
      body: {}
    };
    this.isReady = false;
  }

  Locale.prototype.build = function L_build(callback) {
    if (!callback) {
      var sync = true;
    }

    var resourcesToBuild = this.resources.length;
    if (resourcesToBuild === 0) {
      throw new ContextError('Locale has no resources');
    }

    var self = this;
    var resourcesWithErrors = 0;
    this.resources.forEach(function(res) {
      res.build(resourceBuilt, sync);
    });

    function resourceBuilt(err) {
      if (err) {
        resourcesWithErrors++;
        self.emitter.emit(err instanceof ContextError ? 'error' : 'warning', 
                          err);
      }
      resourcesToBuild--;
      if (resourcesToBuild == 0) {
        if (resourcesWithErrors == self.resources.length) {
          // XXX Bug 908780 - Decide what to do when all resources in
          // a locale are missing or broken
          // https://bugzilla.mozilla.org/show_bug.cgi?id=908780
          self.emitter.emit('error',
            new ContextError('Locale has no valid resources'));
        }
        self.flatten.call(self, callback);
      }
    }
  };

  Locale.prototype.flatten = function L_flatten(callback) {
    this.ast.body = this.resources.reduce(function(prev, curr) {
      if (!curr.ast) {
        return prev;
      }
      for (var key in curr.ast.body) {
        if (curr.ast.body.hasOwnProperty(key)) {
          prev[key] = curr.ast.body[key];
        }
      }
      return prev;
    }, this.ast.body);

    this.entries = this.compiler.compile(this.ast);
    this.isReady = true;
    if (callback) {
      callback();
    }
  };

  Locale.prototype.clean = function L_clean() {
    this.ast = null;
    this.resources = null;
    this.parser = null;
    this.compiler = null;
  };

  Locale.prototype.getEntry = function L_getEntry(id) {
    if (this.entries.hasOwnProperty(id)) {
      return this.entries[id];
    }
    return undefined;
  };

  Locale.prototype.hasResource = function L_gasResource(uri) {
    return this.resources.some(function(res) {
      return res.id === uri;
    });
  };

  function Context(id) {

    this.id = id;

    this.registerLocales = registerLocales;
    this.requestLocales = requestLocales;
    this.addDictionary = addDictionary;
    this.addResource = addResource;
    this.linkResource = linkResource;

    this.get = get;
    this.getEntity = getEntity;
    this.getSource = getSource;
    this.getSources = getSources;
    this.ready = ready;
    this.once = once;
    this.cleanBuiltLocales = cleanBuiltLocales;

    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;

    Object.defineProperty(this, 'supportedLocales', {
      get: function() { return _fallbackChain.slice(); },
      enumerable: true
    });

    // registered and available languages
    var _default = 'i-default';
    var _registered = [_default];
    var _requested = [];
    var _fallbackChain = [];
    // Locale objects corresponding to the registered languages
    var _locales = {};

    // URLs or text of resources (with information about the type) added via
    // linkResource
    var _reslinks = [];

    var _isReady = false;
    var _isFrozen = false;

    Object.defineProperty(this, 'isReady', {
      get: function() { return _isReady; },
      enumerable: true
    });

    var _emitter = new EventEmitter();
    var _parser = new Parser();
    var _compiler = new Compiler();

    _parser.addEventListener('error', error);
    _compiler.addEventListener('error', warn);

    var self = this;

    function get(id, data) {
      if (!_isReady) {
        throw new ContextError('Context not ready');
      }
      return getFromLocale.call(self, 0, id, data).value;
    }

    function getEntity(id, data) {
      if (!_isReady) {
        throw new ContextError('Context not ready');
      }
      return getFromLocale.call(self, 0, id, data);
    }

    function getSource(id) {
      if (!_isReady) {
        throw new ContextError('Context not ready');
      }

      var current = 0;
      var locale = getLocale(_fallbackChain[current]);
      // if the requested id doesn't exist in the first locale, fall back
      while (!locale.getEntry(id)) {
        warn(new TranslationError('Not found', id, _fallbackChain, locale));
        var nextLocale = _fallbackChain[++current];
        if (!nextLocale) {
          return null;
        }

        locale = getLocale(nextLocale);
        if (!locale.isReady) {
          locale.build();
        }
      }
      return locale.ast.body[id];
    }

    function getSources() {
      if (!_isReady) {
        throw new ContextError('Context not ready');
      }
      var defLoc = getLocale(_default);
      if (!defLoc.isReady) {
        defLoc.build();
      }
      var body = {};
      for (var id in defLoc.entries) {
        if (!defLoc.entries.hasOwnProperty(id)) {
          continue;
        }
        // if it's an Entity, add it
        if (defLoc.entries[id].get) {
          var source = getSource(id);
          if (source) {
            body[id] = source;
          }
        }
      }
      return body;
    }

    function ready(callback) {
      if (_isReady) {
        setTimeout(callback);
      }
      addEventListener('ready', callback);
    }

    function once(callback) {
      if (_isReady) {
        setTimeout(callback);
      }
      var callAndRemove = function callAndRemove() {
        removeEventListener('ready', callAndRemove);
        callback();
      };
      addEventListener('ready', callAndRemove);
    }

    function getFromLocale(cur, id, data, prevSource) {
      var loc = _fallbackChain[cur];
      if (!loc) {
        error(new ContextRuntimeError('Unable to get translation', id,
                               _fallbackChain));
        // imitate the return value of Compiler.Entity.get
        return {
          value: prevSource ? prevSource.source : id,
          attributes: {},
          globals: {},
          locale: prevSource ? prevSource.loc : null
        };
      }

      var locale = getLocale(loc);
      if (!locale.isReady) {
        // build without a callback, synchronously
        locale.build(null);
      }

      var entry = locale.getEntry(id);

      // if the entry is missing, just go to the next locale immediately
      if (entry === undefined) {
        warn(new TranslationError('Not found', id, _fallbackChain, locale));
        return getFromLocale.call(this, cur + 1, id, data, prevSource);
      }

      // otherwise, try to get the value of the entry
      try {
        var value = entry.get(data);
      } catch (e) {
        if (e instanceof Compiler.RuntimeError) {
          error(new TranslationError(e.message, id, _fallbackChain, locale));
          if (e instanceof Compiler.ValueError) {
            // salvage the source string which the compiler wasn't able to
            // evaluate completely;  this is still better than returning the
            // identifer;  prefer a source string from locales earlier in the
            // fallback chain, if available
            var source = prevSource || { source: e.source, loc: locale.id };
            return getFromLocale.call(this, cur + 1, id, data, source);
          }
          return getFromLocale.call(this, cur + 1, id, data, prevSource);
        } else {
          throw error(e);
        }
      }
      value.locale = locale.id;
      return value;
    }

    function add(text, locale) {
      var res = new Resource(null, _parser);
      res.source = text;
      locale.resources.push(res);
    }

    function addResource(text) {
      if (_isFrozen) {
        throw new ContextError('Context is frozen');
      }
      _reslinks.push(['text', text]);
    }

    function addDictionary(scriptNode, loc) {
      if (_isFrozen) {
        throw new ContextError('Context is frozen');
      }
      _reslinks.push(['dict', scriptNode, loc]);
    }

    function addJSON(scriptNode, locale) {
      var res = new Resource(null);
      res.ast = JSON.parse(scriptNode.innerHTML);
      locale.resources.push(res);
    }

    function linkResource(uri) {
      if (_isFrozen) {
        throw new ContextError('Context is frozen');
      }
      _reslinks.push([typeof uri === 'function' ? 'template' : 'uri', uri]);
    }

    function link(uri, locale) {
      if (!locale.hasResource(uri)) {
        var res = new Resource(uri, _parser);
        locale.resources.push(res);
      }
    }

    function registerLocales(defaultLocale, availableLocales) {
      if (_isFrozen) {
        throw new ContextError('Context is frozen');
      }

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

    function cleanBuiltLocales() {
      for (var loc in _locales) {
        if (_locales.hasOwnProperty(loc) && _locales[loc].isReady) {
          _locales[loc].clean();
        }
      }
    }

    function getLocale(code) {
      if (_locales[code]) {
        return _locales[code];
      }

      var locale = new Locale(code, _parser, _compiler, _emitter);
      _locales[code] = locale;
      // populate the locale with resources
      for (var j = 0; j < _reslinks.length; j++) {
        var res = _reslinks[j];
        if (res[0] === 'text') {
          // a resource added via addResource(String)
          add(res[1], locale);
        } else if (res[0] === 'dict') {
          // a JSON resource added via addDictionary(HTMLScriptElement)
          // only add if no locale was specified or if the locale specified
          // matches the locale being created here
          if (res[2] === undefined || res[2] === locale.id) {
            addJSON(res[1], locale);
          }
        } else if (res[0] === 'uri') {
          // a resource added via linkResource(String)
          link(res[1], locale);
        } else {
          // a resource added via linkResource(Function);  the function
          // passed is a URL template and it takes the current locale's code
          // as an argument
          link(res[1](locale.id), locale);
        }
      }
      locale.ast.body['plural'] = {
        type: 'Macro',
        args: [{
          type: 'Identifier',
          name: 'n'
        }],
        expression: getPluralRule(code)
      };
      return locale;
    }

    function requestLocales() {
      if (_isFrozen && !_isReady) {
        throw new ContextError('Context not ready');
      }

      if (_reslinks.length == 0) {
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
        freeze(fallbackChain);
      }
    }

    function freeze(fallbackChain) {
      _fallbackChain = fallbackChain;
      var locale = getLocale(_fallbackChain[0]);
      if (locale.isReady) {
        setReady();
      } else {
        locale.build(setReady);
      }
    }

    function setReady() {
      _isReady = true;
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
  Context.RuntimeError = ContextRuntimeError;
  Context.TranslationError = TranslationError;

  function ContextError(message) {
    this.name = 'ContextError';
    this.message = message;
  }
  ContextError.prototype = Object.create(Error.prototype);
  ContextError.prototype.constructor = ContextError;

  function ContextRuntimeError(message, id, supported) {
    ContextError.call(this, message);
    this.name = 'ContextRuntimeError';
    this.entity = id;
    this.supportedLocales = supported.slice();
    this.message = id + ': ' + message + '; tried ' + supported.join(', ');
  }
  ContextRuntimeError.prototype = Object.create(ContextError.prototype);
  ContextRuntimeError.prototype.constructor = ContextRuntimeError;

  function TranslationError(message, id, supported, locale) {
    ContextRuntimeError.call(this, message, id, supported);
    this.name = 'TranslationError';
    this.locale = locale.id;
    this.message = '[' + this.locale + '] ' + id + ': ' + message;
  }
  TranslationError.prototype = Object.create(ContextRuntimeError.prototype);
  TranslationError.prototype.constructor = TranslationError;

  exports.Context = Context;
  exports.Locale = Locale;
  exports.Resource = Resource;
