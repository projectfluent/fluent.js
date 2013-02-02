//  interakcje miedzy plikami
//  getMany + callback
//  merge



(function() {
  'use strict';

//var when = require('./when.js');
//var IO = require('./io.js').IO;

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

  function Resource(id, ctx, parser) {
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
    this.injectResource = injectResource;
    this.addResource = addResource;
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

    function injectResource(id, text) {
      var res = new Resource(id, ctx, parser);
      var source = new Source(id, text);
      res.source = source;
      source.ast = parser.parse(source.text);
      // build (merge) the resource when all its imports are loaded
      //_resources_parsed.push(res);
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

    function loadSourceAsync(uri, attempt) {
      var loaded = when.defer();
      var url = resolveURI(uri, ctx.settings.locales[0], ctx.settings.schemes[attempt]);
      if (self.source) {
        url = relativeToSelf(url);
      }
      //url = L20n.env.getURL(url, true);
      IO.loadAsync(url).then(
        function loadResource_success(text) {
          var source = new Source(url, text);
          loaded.resolve(source);
        },
        function loadResource_failure() {
          if (ctx.settings.schemes.length >= attempt+1) {
            loadSourceAsync(uri, attempt+1).then(
              function(source) {
                return loaded.resolve(source);
              },
              function() {
                return loaded.resolve();
              }
            );
          } else {
            return loaded.resolve();
          }
        }
      );
      return loaded.promise;
    }

    function loadSourceSync(uri, attempt) {
      var url = resolveURI(uri, ctx.settings.locales[0], ctx.settings.schemes[attempt]);
      if (self.source) {
        url = relativeToSelf(url);
      }
      //url = L20n.env.getURL(url, false);
      var text = null;
      if (ctx.settings.schemes.length >= attempt+1 ||
          (ctx.settings.schemes.length === 0 && attempt === 0)) {
        text = IO.loadSync(url);
        if (text) {
          var source = new Source(url, text);
          return source;
        } else {
          return loadSourceSync(uri, attempt+1);
        }
      }
      return false;
    }

    function addResource(uri, async, nesting) {
      if (nesting > 7) {
        return false;
      }
      var res = new Resource(uri, ctx, parser);
      self.resources.push(res);
      if (async) {
        var parsed = when.defer();
        _resources_parsed.push(parsed);
        loadSourceAsync(uri, 0).then(
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
        res.source = loadSourceSync(uri, 0);
        res.parse(false, nesting);
        //_resources_parsed.push(res);
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

  function Context(id, parentContext) {

    this.ContextError = ContextError;
    this.data = {};
    this.isFrozen = null;
    this.isReady = null;

    this.injectResource = injectResource;
    this.addResource = addResource;
    this.freeze = freeze;

    this.get = get;
    this.getEntity = getEntity;
    this.getAttribute = getAttribute;
    this.getMany = getMany;
    this.getEntities = null;

    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;

    var _isFrozen = false;
    var _emitter = new L20n.EventEmitter();
    var _parser = new L20n.Parser(L20n.EventEmitter);
    var _compiler = new L20n.Compiler(L20n.EventEmitter, L20n.Parser);
    var _resource = new Resource(null, this, _parser);
    var _entries = {};
    var _ctxdata = {};
    var _globals = {};
    var _listeners = [];
    var _subContext = null;
    var _settings = {
      'locales': [],
      'schemes': [],
      'timeout': 500,
    };

    _parser.addEventListener('error', echo);
    _compiler.addEventListener('error', echo);

    function get(id, data) {
      if (!_resource.isReady) {
        throw "Error: context not ready";
      }
      var entity = _entries[id];
      if (!entity) {
        emit('Missing entity', id);
        return getFromSubContext(id, data);
      }
      var args = getArgs(data);
      try {
        return entity.toString(args);
      } catch (e) {
        emit('Entity could not be resolved', id);
        return getFromSubContext(id, data, e.source);
      }
    }

    function getFromSubContext(id, data, fallback) {
      var sc = getSubContext();
      var val = null;
      if (sc) {
        val = sc.get(id, data);
      } else {
        emit('No more locale fallbacks', id);
      }
      if (parentContext || val !== null) {
        return val;
      }
      return fallback ? fallback : id;
    }

    function getArgs(data) {
      var args = Object.create(_ctxdata);
      if (data) {
        for (var i in data) {
          args[i] = data[i];
        }
      }
      return args;
    }

    function resolveMany(ids, data) {
      var values = {};
      for (var i in ids) {
        values[ids[i]] = get(ids[i], data);
      }
      return values;
    }

    function getMany(ids, data) {
      var deferred = when.defer();
      if (_resource.isReady) {
        var values = resolveMany(ids, data);
        deferred.resolve(values);
      } else {
        setTimeout(function() {
          deferred.reject();
        }, 500);
        addEventListener('ready', function() {
          var values = resolveMany(ids, data);
          deferred.resolve(values);
        });
      }
      return deferred.promise;
    }

    function getAttribute(id, data) {
      if (!_resource.isReady) {
        throw "Error: context not ready";
      }
      var entity = _entries[id];
      if (!entity || entity.local) {
        throw "No such entity: " + id;
      }
      var attribute = entity.attributes[attr]
      if (!attribute || attribute.local) {
        throw "No such attribute: " + attr;
      }
      var args = getArgs(data);
      return attribute.toString(args);
    }

    function getEntity(id, data) {
      if (!_resource.isReady) {
        throw "Error: context not ready";
      }
      var entity = _entries[id];
      if (!entity || entity.local) {
        throw "No such entity: " + id;
      }
      var args = getArgs(data);
      var attributes = {};
      for (var attr in entity.attributes) {
        var attribute = entity.attributes[attr];
        if (!attribute.local) {
          attributes[attr] = attribute.toString(args);
        }
      }
      return {
        value: entity.toString(args),
        attributes: attributes
      };
    }

    function injectResource(id, text) {
      _resource.injectResource(id, text);
      return this;
    }

    function addResource(uri, async) {
      if (async === undefined) {
        async = true;
      }
      _resource.addResource(uri, async, 0);
      return this;
    }

    function freeze() {
      _isFrozen = true;
      _resource.build().then(
        function freeze_success() {
          _entries = _compiler.compile(_resource.ast);
          _emitter.emit('ready');
        }
      );
      return this;
    }

    function getSubContext() {
      if (_settings.locales.length < 2) {
        return null;
      }
      if (_subContext === null) {
        _subContext = new Context(null, self);
        _subContext.settings.locales = _settings.locales.slice(1);
        _subContext.addEventListener('error', echo);
        if (_settings.schemes.length) {
          _subContext.settings.schemes = _settings.schemes;
        }
        for (var i in _resource.resources) {
          if (_resource.resources[i].id === null) {
            _subContext.injectResource(null, _resource.resources[i].source.text);
          } else {
            _subContext.addResource(_resource.resources[i].id, false);
          }
        }
        _subContext.freeze();
      }
      return _subContext;
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

    this.__defineSetter__('data', function(data) {
      _ctxdata = data;
    });

    this.__defineGetter__('data', function() {
      return _ctxdata;
    });

    Object.defineProperty(this, 'settings', {
      value: Object.create(Object.prototype, {
        locales: {
          get: function() { return _settings.locales },
          set: function(val) {
            if (!Array.isArray(val)) {
              throw "Locales must be a list";
            }
            if (val.length == 0) {
              throw "Locales list must not be empty";
            }
            if (_settings.locales.length > 0) {
              throw "Can't overwrite locales";
            }
            _settings.locales = val;
            Object.freeze(_settings.locales);
          },
          configurable: false,
          enumerable: true,
        },
        schemes: {
          get: function() { return _settings.schemes },
          set: function(val) {
            if (!Array.isArray(val)) {
              throw "Schemes must be a list";
            }
            if (val.length == 0) {
              throw "Scheme list must not be empty";
            }
            if (_settings.schemes.length > 0) {
              throw "Can't overwrite schemes";
            }
            _settings.schemes = val;
            Object.freeze(_settings.schemes);
          },
          configurable: false,
          enumerable: true,
        },
        timeout: {
          get: function() { return _settings.timeout },
          set: function(val) {
            if (typeof(val) !== 'number') {
              throw "Timeout must be a number";
            }
            _settings.timeout = val;
          },
          configurable: false,
          enumerable: true,
        },
      }),
      writable: false,
      enumerable: false,
      configurable: false,
    });
  };
  
  function _expandUrn(urn, vars) {
    return urn.replace(/(\{\{\s*(\w+)\s*\}\})/g,
        function(match, p1, p2, offset, string) {
          if (vars.hasOwnProperty(p2)) {
            return vars[p2];
          } else {
            throw "Cannot use the undefined variable: "+p2;
          }
          return p1;
        });
  }

  function resolveURI(uri, locale, scheme) {
    if (!/^l10n:/.test(uri)) {
      return uri;
    }
    var match = uri.match(/^l10n:(?:([^:]+):)?([^:]+)/);
    var res, app;
    if (match === null) {
      throw "Malformed resource scheme: " + uri;
    }
    if (match[2] && match[2][0] == '/' && match[2][1] == '/') {
      res = match[0].substring(5);
      app = '';
    } else {
      res = match[2];
      app = match[1];
    }
    var vars = {
      'app': app,
      'resource': res
    };
    if (locale) {
      vars['locale'] = locale;
    }
    if (!scheme) {
      if (app) {
        throw "You need to define schemes to use with app uris";
      }
      return _expandUrn(res, vars);
    }
    return _expandUrn(scheme, vars);
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

  this.L20n = L20n;

}).call(this);
