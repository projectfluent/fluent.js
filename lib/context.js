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
    this.addResource = addResource;
    this.linkResource = linkResource;
    this.parse = parse;

    var _resources_parsed = [];
    var _imports_positions = [];

    function inlineResource(res, pos) {
      // is this the Context's _resource?
      if (self.source === null) {
        self.ast.body = self.ast.body.concat(res.source.ast.body);
      } else {
        Array.prototype.splice.apply(self.ast.body,
                                     [pos, 1].concat(res.source.ast.body));
      }
    }

    function merge() {
      for (var i = 0, res; res = self.resources[i]; i++) {
        var pos = _imports_positions[i];
        // source is false (sync) or undefined (async) if the source file fails 
        // to download
        if (res.source) {
          inlineResource(res, pos);
        }
      }
    }

    function parse(async, nesting) {
      this.ast = this.source.ast = parser.parse(this.source.text);
      var imports = this.source.ast.body.filter(function(elem, i) {
        if (elem.type == 'ImportStatement') {
          _imports_positions.push(i);
          return true;
        }
        return false;
      });
      imports.forEach(function(imp) {
        addResource(imp.uri.content, async, nesting + 1); 
      });
    }

    function addResource(id, text) {
      var res = new Resource(id, parser);
      var source = new Source(id, text);
      res.source = source;
      source.ast = parser.parse(source.text);
      this.resources.push(res);
      _imports_positions.push(0);
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

    function loadSourceAsync(url) {
      var loaded = when.defer();
      if (self.source) {
        url = relativeToSelf(url);
      }
      L20n.IO.loadAsync(url).then(
        function loadResource_success(text) {
          var source = new Source(url, text);
          loaded.resolve(source);
        },
        function loadResource_failure() {
          return loaded.resolve();
        }
      );
      return loaded.promise;
    }

    function loadSourceSync(url) {
      if (self.source) {
        url = relativeToSelf(url);
      }
      var text = null;
      text = L20n.IO.loadSync(url);
      if (text) {
        var source = new Source(url, text);
        return source;
      }
      return false;
    }

    function linkResource(url, async, nesting) {
      if (nesting > 7) {
        return false;
      }
      var res = new Resource(url, ctx, parser);
      self.resources.push(res);
      if (async) {
        var parsed = when.defer();
        _resources_parsed.push(parsed);
        loadSourceAsync(url).then(
            function(source) {
              if (source) {
                res.source = source;
                res.parse(true, nesting);
              }
            }
          ).then(
            function() {
              parsed.resolve(res);
            }
          );
      } else {
        res.source = loadSourceSync(url);
        res.parse(false, nesting);
      }
    }

    function build() {
      var merged = when.defer();
      when.all(_resources_parsed).then(
        function() {
          var imports_built = [];
          self.resources.forEach(function(res) {
            imports_built.push(res.build());
          });
          when.all(imports_built).then(
            function() {
              merge();
              self.isReady = true;
              return merged.resolve();
            }
          );
        });
      return merged.promise;
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
      this.resource.build().then(
        function freeze_success() {
          _entries = compiler.compile(self.resource.ast);
          callback();
        }
      );
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
    // singleton within the context
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
      _locales[0].resource.addResource(null, text);
    }

    function linkResource(uri) {
      if (_locales.length === 0) {
        _locales.push(new Locale(null, _parser, _compiler));
      }
      _locales[0].resource.linkResource(uri);

    }

    function bindResource(uri, text) {
    }

    function freeze(async) {
      _isFrozen = true;
      _locales[0].freeze(ready);
      return this;
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
