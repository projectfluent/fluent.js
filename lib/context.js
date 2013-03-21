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

    var self = this;

    function build(nesting) {
      if (nesting >= 7) {
        throw new ContextError("Too many nested imports.");
      }
      return fetch().then(parse).then(function(ast) {
        buildImports(ast, nesting + 1);
      }).then(inline);
    }

    function fetch() {
      var source = when.defer();
      if (self.source) {
        source.resolve(self.source);
        return source.promise;
      }
      L20n.IO.loadAsync(id).then(
        function loadResource_success(text) {
          self.source = new Source(id, text);
          source.resolve(self.source);
        },
        function loadResource_failure() {
          return source.resolve();
        }
      );
      return source.promise;
    }

    function parse(source) {
      var ast = when.defer();
      self.ast = self.source.ast = parser.parse(source.text);
      ast.resolve(self.ast);
      return ast.promise;
    }

    function buildImports(ast, nesting) {
      var imports = ast.body.filter(function(elem, i) {
        if (elem.type == 'ImportStatement') {
          _imports_positions.push(i);
          return true;
        }
        return false;
      });

      imports.forEach(function(imp) {
        var uri = relativeToSelf(imp.uri.content);
        var res = Resource(uri, parser);
        self.resources.push(res);
      });

      var imports_built = [];
      self.resources.forEach(function(res) {
        imports_built.push(res.build(nesting));
      });

      return when.all(imports_built);
    }

    function inline() {
      for (var i = 0, res; res = self.resources[i]; i++) {
        var pos = _imports_positions[i];
        // source is false (sync) or undefined (async) if the source file fails 
        // to download
        if (res.source) {
          // check if this is the Locale's _resource
          if (self.source === null) {
            self.ast.body = self.ast.body.concat(res.source.ast.body);
          } else {
            Array.prototype.splice.apply(self.ast.body,
              [pos, 1].concat(res.source.ast.body));
          }
        }
      }
      self.isReady = true;
      var flat = when.defer();
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
    this.get = get;

    var _entries = null;


    function freeze(callback) {
      var self = this;
      this.resource.build().then(function freeze_success() {
        _entries = compiler.compile(self.resource.ast);
        callback();
      });
    }

    function get(id, data) {
      return _entries[id].toString();
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
      return _locales[0].get(id, getArgs.bind(this, data));
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
          _locales[i].resource.linkResource(uri(_locales[i].id));
        }
      } else {
        _locales[0].resource.linkResource(uri);
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
