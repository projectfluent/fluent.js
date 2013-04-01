(function() {
  'use strict';

  var L20n = {
    Context: Context,
    LangPack: new Worker('../../lib/lps.js'),
    getContext: function L20n_getContext(id) {
      return new Context(id);
    },
  };

  function Resource(id, parser) {
    var self = this;

    this.id = id;
    this.resources = [];
    this.source = null;
    this.isReady = false;
    this.ast = {
      type: 'LOL',
      body: [],
    };

    this.build = build;
    this.fetch = fetch;
    this.parse = parse;
    this.buildImports = buildImports;
    this.flatten = flatten;

    var _imports_positions = [];

    function build(nesting, async) {
      if (nesting >= 7) {
        throw new ContextError("Too many nested imports.");
      }
      return fetch(async)
        .then(parse)
        .then(buildImports.bind(this, nesting + 1, async))
        .then(flatten);
    }

    function fetch(async) {
      if (self.source) {
        var source = when.defer();
        source.resolve();
        return source.promise;
      }
      return L20n.IO.load(self.id, async).then(
        function loadResource_success(text) {
          L20n.IO.bind(self.id, text);
          self.source = text;
        },
        function loadResource_failure() {
        }
      );
    }

    function parse() {
      self.ast = parser.parse(self.source);
    }

    function buildImports(nesting, async) {
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

      var imports_built = [];
      self.resources.forEach(function(res) {
        imports_built.push(res.build(nesting, async));
      });

      return when.all(imports_built);
    }

    function flatten() {
      for (var i = self.resources.length-1; i >= 0; i--) {
        var pos = _imports_positions[i] || 0;
        Array.prototype.splice.apply(self.ast.body,
          [pos, 1].concat(self.resources[i].ast.body));
      }
      self.isReady = true;
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

  function Locale(id, parser, compiler) {
    this.id = id;
    this.resources = [];
    this.entries = null;
    this.ast = {
      type: 'LOL',
      body: [],
    };
    this.isReady = false;

    this.build = build;
    this.getEntry = getEntry;

    var self = this;

    function build(async) {
      return buildResources(async)
        .then(flatten)
        .then(compile);
    }

    function buildResources(async) {
      var resources_built = [];
      self.resources.forEach(function(res) {
        resources_built.push(res.build(0, async));
      });

      return when.all(resources_built);
    }

    function flatten() {
      self.ast.body = self.resources.reduce(function(prev, curr) {
        return prev.concat(curr.ast.body);
      }, self.ast.body);
    }

    function compile() {
      self.entries = compiler.compile(self.ast);
      self.isReady = true;
    }

    function getEntry(id) { 
      if (this.entries.hasOwnProperty(id)) {
        return this.entries[id];
      }
      return undefined;
    }
  }

  function Context(id) {

    this.id = id;
    this.data = {};

    this.addResource = addResource;
    this.linkResource = linkResource;
    this.bindResource = bindResource;
    this.registerLocales = registerLocales;
    this.freeze = freeze;

    this.get = get;
    this.getEntity = getEntity;
    this.localize = localize;

    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;

    // all languages registered as available (list of codes)
    var _available = [];
    var _locales = {};
    // a special Locale for resources not associated with any other
    var _none;

    var _isFrozen = false;
    var _isReady = false;
    var _emitter = new L20n.EventEmitter();
    var _parser = new L20n.Parser(L20n.EventEmitter);
    var _compiler = new L20n.Compiler(L20n.EventEmitter, L20n.Parser);
    var _globals = {
      get hour() {
        return new Date().getHours();
      },
    };
    var _listeners = [];
    var _pending = [];
    this.addEventListener('ready', getPending.bind(this));

    _parser.addEventListener('error', echo);
    _compiler.addEventListener('error', echo);
    _compiler.setGlobals(_globals);

    function localize(ids, data, callback) {
      if (_isReady) {
        getMany(ids, data, callback);
        return;
      }
      this.addEventListener('ready', function() {
        getMany(ids, data, callback);
      });
    }

    function getMany(ids, data, callback) {
      var vals = {};
      for (var i = 0, id; id = ids[i]; i++) {
        vals[id] = getEntity(id, data);
      }
      callback(vals);
    }

    function get(id, data, callback) {
      return _get(id, data, callback, false);
    }

    function getEntity(id, data, callback) {
      return _get(id, data, callback, true);
    }

    function getLocale(i) {
      // if we're out of locales from `_available`, resort to `_none`
      if (_available.length - i == 0) {
        return _none;
      }
      return  _locales[_available[i]];
    }

    function _get(id, data, callback, returnEntity) {
      if (!_isReady) {
        if (!callback) {
          throw new ContextError("Context not ready");
        }
        _pending.push([id, data, callback, returnEntity]);
        return;
      }
      var sourceString;
      var locale, i = 0; 
      while (locale = getLocale(i)) {
        if (!locale.isReady) {
          // build the fallback locale synchronously
          locale.build(false);
        }
        var entry = locale.getEntry(id);
        // if the entry is missing, just go to the next locale immediately
        if (entry === undefined) {
          var ex = new EntityError("Entity not found", id, locale.id);
          _emitter.emit('error', ex);
          i++;
          continue;
        }
        // otherwise, try to get the string value of the entry
        try {
          var getter = returnEntity ? entry.getEntity : entry.getString;
          var val = getter.call(entry, getArgs.bind(this, data));
          if (i > 0) {
            var ex = new GetError("Entity found in a fallback language ", id, 
                                  _available.slice(0, i));
            _emitter.emit('error', ex);
          }
          callback && callback(val);
          return val;
        } catch(e) {
          if (e instanceof L20n.Compiler.ValueError) {
            var ex = new EntityError("Unknown reference in entity's value", id, 
                                     locale.id);
            _emitter.emit('error', ex);
            if (!sourceString) {
              sourceString = e.source;
            }
          } else if (e instanceof L20n.Compiler.IndexError) {
            var ex = new EntityError("Entity couldn't be evaluated to " +
                                     "a single string", id, locale.id);
            _emitter.emit('error', ex);
          } else {
            throw e;
          }
          // try the next locale
          i++;
        }
      }
      var ex = new GetError("Entity couldn't be retrieved", id, _available);
      _emitter.emit('error', ex);
      // fallback hard on the identifier, or on sourceString if available
      var val = sourceString ? sourceString : id;
      callback && callback(val);
      return val;
    }

    function getArgs(data) {
      if (!data) {
        return this.data;
      }
      var args = {};
      for (var i in this.data) {
        if (this.data.hasOwnProperty(i)) {
          args[i] = this.data[i];
        }
      }
      if (data) {
        for (i in data) {
          if (data.hasOwnProperty(i)) {
            args[i] = data[i];
          }
        }
      }
      return args;
    }

    function getPending() {
      while (_pending.length) {
        var req = _pending.shift()
        return _get.apply(this, req);
      }
    }

    function addResource(text) {
      if (_available.length === 0) {
        _none = new Locale(null, _parser, _compiler);
      } else {
        // XXX should addResource add the text to all locales in the multilocale 
        // mode?  or throw?
        throw new ContextError("Can't use addResource with registered languages");
      }
      var res = new Resource(null, _parser);
      res.source = text;
      _none.resources.push(res);
    }

    function linkResource(uri) {
      bindResource(uri);
    }

    function bindResource(uri, text) {
      if (typeof uri === 'function') {
        bindTemplate(uri, text);
      } else {
        bindText(uri, text);
      }
    }

    function bindTemplate(uri, text) {
      for (var lang in _locales) {
        var loc = _locales[lang];
        var res = new Resource(uri(lang), _parser);
        // XXX detect if the resource has been already added?
        loc.resources.push(res);
        if (typeof text === 'function') {
          L20n.IO.bind(uri(lang), text(lang));
        } else if (text !== undefined) {
          throw new ContextError("Arguments to bindResource must be of " +
                                 "the same type");
        }
      }
    }

    function bindText(uri, text) {
      if (_none === undefined) {
        _none = new Locale(null, _parser, _compiler);
      }
      var res = new Resource(uri, _parser);
      // XXX detect if the resource has been already added?
      _none.resources.push(res);
      if (typeof text === 'string') {
        L20n.IO.bind(uri, text);
      } else if (text !== undefined) {
        throw new ContextError("Arguments to bindResource must be of " +
                               "the same type");
      }
    }

    function registerLocales() {
      for (var i in arguments) {
        var lang = arguments[i];
        _available.push(lang);
        _locales[lang] = new Locale(lang, _parser, _compiler);
      }
    }

    function getLocalesFromLangPackService() {
      var locales = when.defer();
      L20n.LangPack.addEventListener('message', function(msg) {
        var res = msg.data;
        if (res.type !== 'getLocales') {
          return;
        }
        locales.resolve(res.locales);
        // XXX remove the listener?
      }, false);
      L20n.LangPack.postMessage({
        type: 'getLocales',
        domain: id,
      });
      return locales.promise;
    }

    function negotiateLanguages() {
      var ordered = when.defer();
      if (!id) {
        ordered.resolve(_available);
        return ordered.promise;
      }
      getLocalesFromLangPackService().then(function(locales) {
        var all = _available.concat(locales);
        // de-duplicate the list of languages
        all = all.filter(function(elem, pos, arr) {
          return arr.indexOf(elem) == pos;
        });
        _available = L20n.Intl.prioritizeLocales(all);
        console.log(_available);
        ordered.resolve();
      });
      return ordered.promise;
    }

    function freeze() {
      _isFrozen = true;
      return negotiateLanguages()
        .then(function() {
          // build the first locale on the fallback list
          var locale = _available.length > 0 ? _locales[_available[0]] : _none;
          return locale.build(true);
        }).then(setReady);
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

    function echo(e) {
      _emitter.emit('error', e);
    }
}

  Context.Error = ContextError;
  Context.EntityError = EntityError;

  function ContextError(message) {
    this.name = 'ContextError';
    this.message = message;
  }
  ContextError.prototype = Object.create(Error.prototype);
  ContextError.prototype.constructor = ContextError;

  function EntityError(message, id, lang) {
    ContextError.call(this, message);
    this.name = 'EntityError';
    this.id = id;
    this.lang = lang;
    this.message = '[' + lang + '] ' + id + ': ' + message;
  }
  EntityError.prototype = Object.create(ContextError.prototype);
  EntityError.prototype.constructor = EntityError;

  function GetError(message, id, langs) {
    ContextError.call(this, message);
    this.name = 'GetError';
    this.id = id;
    this.tried = langs;
    if (langs.length) {
      this.message = id + ': ' + message + '; tried ' + langs.join(', ');
    } else {
      this.message = id + ': ' + message;
    }
  }
  GetError.prototype = Object.create(ContextError.prototype);
  GetError.prototype.constructor = GetError;

  this.L20n = L20n;

}).call(this);
