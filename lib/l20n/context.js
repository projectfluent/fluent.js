if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports, module) {
  'use strict';

  var EventEmitter = require('./events').EventEmitter;
  var Parser = require('./parser').Parser;
  var Compiler = require('./compiler').Compiler;
  var io = require('./platform/io');
  var getPluralRule = require('./plurals').getPluralRule;

  function Resource(id, parser) {
    var self = this;

    this.id = id;
    this.resources = [];
    this.source = null;
    this.ast = null;

    this.build = build;

    var _imports_positions = [];

    function build(nesting, callback, sync) {
      if (nesting >= 7) {
        return callback(new ContextError('Too many nested imports.'));
      }

      if (self.source) {
        // Bug 908826 - Don't artificially force asynchronicity when only using 
        // addResource
        // https://bugzilla.mozilla.org/show_bug.cgi?id=908826
        return sync ? parse() : setTimeout(function() {
          parse();
        });
      } else if (self.ast) {
        return sync ? buildImports() : setTimeout(function() {
          buildImports();
        });
      } else {
        io.load(self.id, parse, sync);
      }

      function parse(err, text) {
        if (err) {
          self.ast = {
            type: 'LOL',
            body: []
          };
          return callback(err);
        } else if (text === undefined) {
          self.ast = parser.parse(self.source);
        } else {
          if (/\.json/.test(self.id)) {
            // JSON is guaranteed to be an AST
            self.ast = JSON.parse(text);
          } else {
            self.source = text;
            self.ast = parser.parse(self.source);
          }
        }
        buildImports();
      }

      function buildImports() {
        var imports = self.ast.body.filter(function(elem, i) {
          if (elem.type == 'ImportStatement') {
            _imports_positions.push(i);
            return true;
          }
          return false;
        });

        imports.forEach(function(imp) {
          var uri = relativeToSelf(imp.uri.content);
          var res = new Resource(uri, parser);
          self.resources.push(res);
        });

        var importsToBuild = self.resources.length;
        if (importsToBuild === 0) {
          return callback();
        }

        self.resources.forEach(function(res) {
          res.build(nesting + 1, resourceBuilt, sync);
        });

        function resourceBuilt(err) {
          if (err) {
            return callback(err);
          }
          importsToBuild--;
          if (importsToBuild == 0) {
            flatten();
          }
        }
      }

      function flatten() {
        for (var i = self.resources.length - 1; i >= 0; i--) {
          var pos = _imports_positions[i] || 0;
          Array.prototype.splice.apply(self.ast.body,
            [pos, 1].concat(self.resources[i].ast.body));
        }
        callback();
      }
    }

    function relativeToSelf(url) {
      if (self.id === null || url[0] == '/') {
        return url;
      } 
      var dirname = self.id.split('/').slice(0, -1).join('/');
      if (dirname) {
        // strip the trailing slash if present
        if (dirname[dirname.length - 1] == '/') {
          dirname = dirname.slice(0, dirname.length - 1);
        }
        return dirname + '/' + url;
      } else {
        return './' + url;
      }
    }

  }

  function Locale(id, parser, compiler, emitter) {
    this.id = id;
    this.resources = [];
    this.entries = null;
    this.ast = {
      type: 'WebL10n',
      body: []
    };
    this.isReady = false;

    this.build = build;
    this.getEntry = getEntry;
    this.hasResource = hasResource;

    var self = this;

    function build(callback) {
      if (!callback) {
        var sync = true;
      }

      var resourcesToBuild = self.resources.length;
      if (resourcesToBuild === 0) {
        throw new ContextError('Locale has no resources');
      }

      var resourcesWithErrors = 0;
      self.resources.forEach(function(res) {
        res.build(0, resourceBuilt, sync);
      });

      function resourceBuilt(err) {
        if (err) {
          resourcesWithErrors++;
          emitter.emit(err instanceof ContextError ? 'error' : 'warning', err);
        }
        resourcesToBuild--;
        if (resourcesToBuild == 0) {
          if (resourcesWithErrors == self.resources.length) {
            // XXX Bug 908780 - Decide what to do when all resources in 
            // a locale are missing or broken
            // https://bugzilla.mozilla.org/show_bug.cgi?id=908780
            emitter.emit('error', 
                         new ContextError('Locale has no valid resources'));
          }
          flatten();
        }
      }

      function flatten() {
        self.ast.body = self.resources.reduce(function(prev, curr) {
          return prev.concat(curr.ast.body);
        }, self.ast.body);
        compile();
      }

      function compile() {
        self.entries = compiler.compile(self.ast);
        self.isReady = true;
        if (callback) {
          callback();
        }
      }
    }

    function getEntry(id) { 
      if (this.entries.hasOwnProperty(id)) {
        return this.entries[id];
      }
      return undefined;
    }

    function hasResource(uri) { 
      return this.resources.some(function(res) {
        return res.id === uri;
      });
    }
  }

  function Context(id) {

    this.id = id;

    this.registerLocales = registerLocales;
    this.registerLocaleNegotiator = registerLocaleNegotiator;
    this.requestLocales = requestLocales;
    this.addResource = addResource;
    this.addDictionary = addDictionary;
    this.linkResource = linkResource;

    this.get = get;
    this.getEntity = getEntity;
    this.getSource = getSource;
    this.getSources = getSources;
    this.ready = ready;

    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;

    Object.defineProperty(this, 'supportedLocales', {
      get: function() { return _fallbackChain.slice(); },
      enumerable: true
    });

    // language negotiator function
    var _negotiator;

    // registered and available languages
    var _default = 'i-default';
    var _registered = [_default];
    var _requested = [];
    var _fallbackChain = [];
    // Locale objects corresponding to the registered languages
    var _locales = {};

    // URLs or text of resources (with information about the type) added via 
    // linkResource and addResource
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
        var nextLoc = _fallbackChain[++current];
        if (!nextLoc) {
          return null;
        }
        locale = getLocale(nextLoc);
        if (!locale.isReady) {
          locale.build();
        }
      }
      // find the AST node by id
      for (var i = 0; i < locale.ast.body.length; i++) {
        if (locale.ast.body[i].id.name === id) {
          return locale.ast.body[i];
        }
      }
      return null;
    }

    function getSources() {
      if (!_isReady) {
        throw new ContextError('Context not ready');
      }
      var defLoc = getLocale(_default);
      if (!defLoc.isReady) {
        defLoc.build();
      }
      var body = [];
      for (var id in defLoc.entries) {
        // if it's an Entity, add it
        if (defLoc.entries[id].get) {
          var source = getSource(id);
          if (source) {
            body.push(source);
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

    function getFromLocale(cur, id, data, prevSource) {
      var loc = _fallbackChain[cur];
      if (!loc) {
        error(new RuntimeError('Unable to get translation', id, 
                               _fallbackChain));
        // imitate the return value of Compiler.Entity.get
        return {
          value: prevSource ? prevSource.source : id,
          attributes: {},
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

    function addResource(text) {
      if (_isFrozen) {
        throw new ContextError('Context is frozen');
      }
      _reslinks.push(['text', text]);
    }

    function add(text, locale) {
      var res = new Resource(null, _parser);
      res.source = text;
      locale.resources.push(res);
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

    function registerLocales(defLocale, available) {
      if (_isFrozen) {
        throw new ContextError('Context is frozen');
      }

      if (defLocale === undefined) {
        return;
      }

      _default = defLocale;
      _registered = [];

      if (!available) {
        available = [];
      }
      available.push(defLocale);

      // uniquify `available` into `_registered`
      available.forEach(function(loc) {
        if (typeof loc !== 'string') {
          throw new ContextError('Language codes must be strings');
        }
        if (_registered.indexOf(loc) === -1) {
          _registered.push(loc);
        }
      });
    }

    function registerLocaleNegotiator(negotiator) {
      if (_isFrozen) {
        throw new ContextError('Context is frozen');
      }
      _negotiator = negotiator;
    }

    function getLocale(loc) {
      if (_locales[loc]) {
        return _locales[loc];
      }
      var locale = new Locale(loc, _parser, _compiler, _emitter);
      _locales[loc] = locale;
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
      locale.ast.body.push({
        type: 'Macro',
        id: {
          type: 'Identifier',
          name: 'plural'
        },
        args: [{
          type: 'Identifier',
          name: 'n'
        }],
        expression: getPluralRule(loc)
      });
      return locale;
    }

    function requestLocales() {
      if (_isFrozen && !_isReady) {
        throw new ContextError('Context not ready');
      }

      _isFrozen = true;
      _requested = Array.prototype.slice.call(arguments);

      if (_requested.length) {
        _requested.forEach(function(loc) {
          if (typeof loc !== 'string') {
            throw new ContextError('Language codes must be strings');
          }
        });
      }

      if (_reslinks.length == 0) {
        throw new ContextError('Context has no resources');
      }

      // the whole language negotiation process can be asynchronous;  for now 
      // we just use _registered as the list of all available locales, but in 
      // the future we might asynchronously try to query a language pack 
      // service of sorts for its own list of locales supported for this 
      // context
        if (!_negotiator) {
          var Intl = require('./intl').Intl;
          _negotiator = Intl.prioritizeLocales;
        }
        _fallbackChain = _negotiator(_registered, _requested, _default);
        var locale = getLocale(_fallbackChain[0]);
        if (locale.isReady) {
          return setReady();
        } else {
          return locale.build(setReady);
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
  Context.RuntimeError = RuntimeError;
  Context.TranslationError = TranslationError;

  function ContextError(message) {
    this.name = 'ContextError';
    this.message = message;
  }
  ContextError.prototype = Object.create(Error.prototype);
  ContextError.prototype.constructor = ContextError;

  function RuntimeError(message, id, supported) {
    ContextError.call(this, message);
    this.name = 'RuntimeError';
    this.entity = id;
    this.supportedLocales = supported.slice();
    this.message = id + ': ' + message + '; tried ' + supported.join(', ');
  }
  RuntimeError.prototype = Object.create(ContextError.prototype);
  RuntimeError.prototype.constructor = RuntimeError;

  function TranslationError(message, id, supported, locale) {
    RuntimeError.call(this, message, id, supported);
    this.name = 'TranslationError';
    this.locale = locale.id;
    this.message = '[' + this.locale + '] ' + id + ': ' + message;
  }
  TranslationError.prototype = Object.create(RuntimeError.prototype);
  TranslationError.prototype.constructor = TranslationError;

  exports.Context = Context;
  exports.Locale = Locale;
  exports.Resource = Resource;

});
