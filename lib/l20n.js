(function() {
  'use strict';

var when = require('./when.js');
var IO = require('./io.js').IO;

  var L20n = {
    getContext: function L20n_getContext(id) {
      return new Context(id);
    }
  };

  function Resource(id) {
    this.source = '';
    this.ast = [];
    this.id = id;
    this.resources = [];
    this.isReady = false;

    this.merge = merge;

    function merge() {
      this.ast= [];
      for (var i in this.resources) {
        this.ast = this.ast.concat(this.resources[i].ast);
      }
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
    this.getEntity = null;
    this.getAttribute = null;
    this.getMany = getMany;
    this.getEntities = null;

    this.addEventListener = addEventListener;
    this.removeEventListener = null;


    var mData = {};
    var _isFrozen = false;
    var _resource = new Resource(null);
    var _parser = new L20n.Parser();
    var _entries = {};
    var _ctxdata = {};
    var _globals = {};
    var _emitter = new L20n.EventEmitter();
    var _listeners = [];
    var _deferreds = [];
    var _subContext = null;
    var _settings = {
      'locales': [],
      'schemes': [],
      'timeout': 500,
    };

    function get(id, data) {
      if (!_resource.isReady) {
        throw "Context is not ready";
      }
      var entity = _entries[id];
      if (!entity) {
        if (_settings.locales < 2) {
          throw "Could not get the entity";
        }
        var sc = getSubContext();
        entity = sc.get(id);
      }
      var args = getArgs(data);
      return entity.toString(args);
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
      return deferred;
    }

    function loadResource(res, sync, attempt) {
      if (!attempt) {
        attempt = 0;
      }
      if (!sync) {
        var deferred = when.defer();
      }
      var uri = resolveURI(res.id, _settings.locales[0], _settings.schemes[attempt]);
      if (sync) {
        var source = IO.loadSync(uri);
        if (!source) {
          if (_settings.schemes.length < attempt+1) {
            return false;
          } else {
            return loadResource(res, sync, attempt+1);
          }
        }
        if (!source) {
          return false;
        } else {
          res.source = source;
          onResourceLoaded(res);
        }
      } else {
        uri= L20n.env.getURL(uri);
        IO.loadAsync(uri).then(
            function loadResource_success(source) {
              res.source = source;
              onResourceLoaded(res);
              deferred.resolve();
            },
            function loadResource_failure() {
              res.isReady = false;
              if (_settings.schemes.length < attempt+1) {
                deferred.resolve();
                return;
              }
              loadResource(res, sync, attempt+1).then(
                function() {
                  deferred.resolve();
                },
                function() {
                  deferred.resolve();
              });
            }
            );
        return deferred.promise;
      }
    }

    function onResourceLoaded(res) {
      res.ast = _parser.parse(res.source).body;
      res.isReady = true;
    }

    function injectResource(id, source) {
      var res = new Resource(id);
      res.source = source;
      _resource.resources.push(res);
      onResourceLoaded(res);
      return this;
    }

    function addResource(uri, sync) {
      if (sync) {
        var res = new Resource(uri);
        _resource.resources.push(res);
        loadResource(res, true);
      } else {
        var res = new Resource(uri);
        _resource.resources.push(res);
        _deferreds.push(loadResource(res));
      }
      return this;
    }

    function freeze() {
      _isFrozen = true;
      when.all(_deferreds).then(
        function freeze_success() {
          _resource.merge();
          _resource.isReady = true;
          _entries = L20n.Compiler.compile(_resource.ast);
          _emitter.emit('ready');
        }
      );
      return this;
    }

    function getSubContext() {
      if (_subContext === null) {
        _subContext = new Context();
        _subContext.settings.locales = _settings.locales.slice(1);
        for (var i in _resource.resources) {
          _subContext.addResource(_resource.resources[i].id, true);
        }
        _subContext.freeze();
      }
      return _subContext;
    }

    function addEventListener(type, listener) {
      _emitter.addEventListener(type, listener);
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
          }
          return p1;
        });
  }

  function resolveURI(uri, locale, scheme) {
    if (!/^l10n:/.test(uri)) {
      return uri;
    }
    var match = uri.match(/^l10n:(?:([^:]+):)?([^:]+)/);
    if (match === null) {
      throw "Malformed resource scheme: " + uri;
    }
    var vars = {
      'locale': locale,
      'app': '',
      'resource': match[2]
    };
    if (!scheme) {
      return _expandUrn(match[2], vars);
    }
    return _expandUrn(scheme, vars);
  }


  this.L20n = L20n;

}).call(this);
