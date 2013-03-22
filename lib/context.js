(function() {
  'use strict';

  var L20n = {
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
    this.inline = inline;

    var _imports_positions = [];

    function build(nesting, async) {
      if (nesting >= 7) {
        throw new ContextError("Too many nested imports.");
      }
      return fetch(async).then(parse).then(function() {
        return buildImports(nesting + 1);
      }).then(inline);
    }

    function fetch(async) {
      var source = when.defer();
      if (self.id === null || self.source) {
        source.resolve();
        return source.promise;
      }
      // ugly, maybe hide this in IO since we're not doing the attempt+1 thing 
      // anymore (we don't have multiple schemes)?
      if (async) {
        L20n.IO.loadAsync(self.id).then(
          function loadResource_success(text) {
            self.source = new Source(id, text);
            source.resolve();
          },
          function loadResource_failure() {
            source.resolve();
          }
        );
      } else {
        var text = L20n.IO.loadSync(self.id);
        self.source = new Source(id, text);
        source.resolve();
      }
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

    function buildImports(nesting) {
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
        imports_built.push(res.build(nesting));
      });

      return when.all(imports_built);
    }

    function inline() {
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

    this.freeze = freeze;
    this.getEntry = getEntry;
    this.entries = null;

    this.isReady = false;

    function freeze(callback, async) {
      var self = this;
      this.resource.build(0, async).then(function freeze_success() {
        self.entries = compiler.compile(self.resource.ast);
        self.isReady = true;
        callback();
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
          locale.freeze(null, false) // false means sync
        }
        var entry = locale.getEntry(id);
        if (entry !== undefined) {
          try {
            return entry.toString(getArgs.bind(this, data));
          } catch(e) {
            if (e instanceof _compiler.ValueError) {
              console.log(e.source);
              // do we only want to fallback soft on the sourceString for the 
              // first locale?
              if (i == 0) {
                sourceString = e.source;
              }
            }
            if (e instanceof _compiler.IndexError) {
              console.log(e.entry);
              // no need to do anything here, so remove this
              // if it runs out of locales, it will go to the 
              // `return id` line.
            }
            // try the next locale
            i++;
          }
        } else {
          i++;
        }
      }
      // fallback hard on the identifier, or on sourceString if available
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

    function freeze(async) {
      _isFrozen = true;
      _locales[0].freeze(ready);
      return this;
    }


    function registerLocales() {
      for (var i in arguments) {
        _locales.push(new Locale(arguments[i], _parser, _compiler));
      }
    }

    function ready() {
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

    function emit(msg, id) {
      _emitter.emit('error', new ContextError(msg, id, _settings.locales[0]));
    }


  /* ContextError class */

  function ContextError(message, id, locale) {
    this.name = 'ContextError';
    this.id = id;
    this.locale = locale;
    this.message = message + ', locale: '+locale+', id: '+id;
  }
  ContextError.prototype = Object.create(Error.prototype);
  ContextError.prototype.constructor = ContextError;

}

  this.L20n = L20n;

}).call(this);
