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
    this.ast = {type: 'LOL', body: []};

    this.build = build;
    this.injectResource = injectResource;
    this.addResource = addResource;
    this.parse = parse;

    var _deferreds = [];

    function merge() {
      if (self.source === null) {
        for (var i in self.resources) {
          if (self.resources[i].source)
            self.ast.body = self.ast.body.concat(self.resources[i].source.ast.body);
        }
      } else {
        self.ast = self.source.ast;
        for (var i=0;i<self.ast.body.length;i++) {
          var node = self.ast.body[i];
          if (node.type == 'ImportStatement') {
            // here we should match the imports with resources
            if (self.resources.length) {
              var res = self.resources.shift();
              if (res.source) {
                Array.prototype.splice.apply(self.ast.body,
                                            [i, 1].concat(res.source.ast.body));
              }
            }
          } 
        }
      }
    }

    function parse(async, nesting) {
      this.source.ast = parser.parse(this.source.text);
      var imports = this.source.ast.body.filter(function(elem) {
        return elem.type == 'ImportStatement';
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
      // XXX it's ready only if we don't allow imports in inlined l20n code
      res.isReady = true;
      this.resources.push(res);
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
      var deferred = when.defer();
      var url = resolveURI(uri, ctx.settings.locales[0], ctx.settings.schemes[attempt]);
      if (self.source) {
        url = relativeToSelf(url);
      }
      //url = L20n.env.getURL(url, true);
      IO.loadAsync(url).then(
        function loadResource_success(text) {
          var source = new Source(url, text);
          deferred.resolve(source);
        },
        function loadResource_failure() {
          if (ctx.settings.schemes.length >= attempt+1) {
            loadSourceAsync(uri, attempt+1).then(
              function(source) {
                return deferred.resolve(source);
              },
              function() {
                return deferred.resolve();
              }
            );
          } else {
            return deferred.resolve();
          }
        }
      );
      _deferreds.push(deferred);
      return deferred.promise;
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
        loadSourceAsync(uri, 0).then(
          function(source) {
            if (source) {
              res.source = source;
              res.parse(true, nesting);
            }
          }
        );
      } else {
        res.source = loadSourceSync(uri, 0);
        res.parse(false, nesting);
      }
    }

    function build() {
      var deferred = when.defer();
      when.all(_deferreds).then(
        function() {
          var deferreds = [];
          self.resources.forEach(function(res) {
            deferreds.push(res.build());
          });
          when.all(deferreds).then(
            function() {
              merge();
              self.isReady = true;
              return deferred.resolve();
            }
          );
        });
      return deferred.promise;
    }

  }

  function Context(id) {

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

    function get(id, data) {
      if (!_resource.isReady) {
        throw "Error: context not ready";
      }
      var entity = _entries[id];
      if (!entity) {
        error('context', 'Missing entity', id, _settings.locales[0]);
        if (_settings.locales.length < 2) {
          error('context', 'No more locale fallbacks', id, _settings.locales[0]);
          return 'Missing entity: '+id;
        }
        var sc = getSubContext();
        return sc.get(id);
      }
      var args = getArgs(data);
      try {
        return entity.toString(args);
      } catch (e) {
        error('context', 'Entity could not be resolved', id, _settings.locales[0]);
        if (_settings.locales.length < 2) {
          error('context', 'No more locale fallbacks', id, _settings.locales[0]);
          // how to stringify the complexstring? what if it's a hash?
          return "here goes source of the complex string";
        }
        var sc = getSubContext();
        return sc.get(id);
      }
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
      if (_subContext === null) {
        _subContext = new Context();
        _subContext.addEventListener('error', function(e) {
          _emitter.emit('error', e);
        });
        _subContext.settings.locales = _settings.locales.slice(1);
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

    function error(type, msg, id, locale) {
      _emitter.emit('error', new ContextError(msg, id, locale));
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
