(function() {
  'use strict';

  var L20n = {
    Context: Context,
    getContext: function L20n_getContext(id) {
      return new Context(id);
    },
  };

  function Source(url, text) {
    this.text = text;
    this.ast = null;
    this.url = url;
  }

// skip _imports_positions
// more logic to build() than parse/fetch etc.

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
      var source = when.defer();
      if (self.id === null || self.source) {
        source.resolve();
        return source.promise;
      }
      L20n.IO.load(self.id, async).then(
        function loadResource_success(text) {
          self.source = new Source(id, text);
          source.resolve();
        },
        function loadResource_failure() {
          source.resolve();
        }
      );
      return source.promise;
    }

    function parse() {
      var ast = when.defer();
      if (!self.source) {
        ast.resolve();
        return ast.promise;
      }
      self.ast = self.source.ast = parser.parse(self.source.text);
      ast.resolve();
      return ast.promise;
    }

    function buildImports(nesting, async) {
      if (self.ast) {
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
      }

      var imports_built = [];
      self.resources.forEach(function(res) {
        imports_built.push(res.build(nesting, async));
      });

      return when.all(imports_built);
    }

    function flatten() {
      var flat = when.defer();
      for (var i = self.resources.length-1; i >= 0; i--) {
        var pos = _imports_positions[i] || 0;
        Array.prototype.splice.apply(self.ast.body,
            [pos, 1].concat(self.resources[i].source.ast.body));
      }
      self.isReady = true;
      flat.resolve();
      return flat.promise;
    }

    function relativeToSelf(url) {
      var dirname = self.source.url.split('/').slice(0, -1).join('/');
      if (url[0] == '/') {
        return url;
      } else if (dirname) {
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
    this.resource = new Resource(null, parser);

    this.compile = compile;
    this.getEntry = getEntry;
    this.entries = null;

    this.isReady = false;

    function compile(async, callback) {
      var self = this;
      this.resource.build(0, async).then(function build_success() {
        self.entries = compiler.compile(self.resource.ast);
        self.isReady = true;
        return callback();
      });
    }

    function getEntry(id) { 
      if (this.entries.hasOwnProperty(id)) {
        return this.entries[id];
      }
      return undefined;
    }
  }

  function Context(id) {

    this.ContextError = ContextError;
    this.data = {};

    this.addResource = addResource;
    this.linkResource = linkResource;
    this.bindResource = bindResource;
    this.registerLocales = registerLocales;
    this.freeze = freeze;

    this.get = get;
    this.getEntity = getEntity;
    this.localize = null;

    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;

    var _isFrozen = false;
    var _emitter = new L20n.EventEmitter();
    var _parser = new L20n.Parser(L20n.EventEmitter);
    var _compiler = new L20n.Compiler(L20n.EventEmitter, L20n.Parser);
    var _globals = {
      get hour() {
        return new Date().getHours();
      },
    };
    var _listeners = [];
    var _languages = [];
    var _locales = [];

    _parser.addEventListener('error', echo);
    _compiler.addEventListener('error', echo);
    _compiler.setGlobals(_globals);

    function get(id, data) {
      var sourceString;
      var locale, i = 0; 
      while (locale = _locales[i]) {
        if (!locale.isReady) {
          // build & compile the locale synchronously
          locale.compile(false);
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
          var rv = entry.toString(getArgs.bind(this, data));
          if (i > 0) {
            var ex = new GetError("Entity found in a fallback language ", id, 
                                  _languages.slice(0, i));
            _emitter.emit('error', ex);
          }
          return rv;
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
      // fallback hard on the identifier, or on sourceString if available
      var ex = new GetError("Entity couldn't be retrieved", id, _languages);
      _emitter.emit('error', ex);
      return sourceString ? sourceString : id;
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

    function getEntity(id, data) {
    }

    function addResource(text) {
      if (_locales.length === 0) {
        _locales.push(new Locale(null, _parser, _compiler));
      }
      var res = new Resource(null, _parser);
      res.source = new Source(null, text);
      _locales[0].resource.resources.push(res);
    }

    function linkResource(uri) {
      if (_locales.length === 0) {
        _locales.push(new Locale(null, _parser, _compiler));
      }
      if (uri instanceof Function) {
        for (var i in _locales) {
          var res = new Resource(uri(_locales[i].id), _parser);
          _locales[i].resource.resources.push(res);
        }
      } else {
        var res = new Resource(uri, _parser);
        _locales[0].resource.resources.push(res);
      }
    }

    function bindResource(uri, text) {
    }

    function freeze() {
      _isFrozen = true;
      _locales[0].compile(true, onCompile);
      return this;
    }

    function registerLocales() {
      for (var i in arguments) {
        var lang = arguments[i];
        _languages.push(lang);
        _locales.push(new Locale(lang, _parser, _compiler));
      }
    }

    function onCompile() {
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
    this.langs = langs;
    this.message = id + ': ' + message + '; tried ' + langs.join(', ');
  }
  GetError.prototype = Object.create(ContextError.prototype);
  GetError.prototype.constructor = GetError;

  this.L20n = L20n;

}).call(this);
