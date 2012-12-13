(function() {
  'use strict';

var when = require('./when.js');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

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
    this.getMany = null;
    this.getEntities = null;

    this.addEventListener = addEventListener;
    this.removeEventListener = null;


    var mData = {};
    var _isFrozen = false;
    var _resource = new Resource(null);
    var _parser = new L20n.Parser();
    var _entries = {};
    var _globals = {};
    var _emitter = new L20n.EventEmitter();
    var _listeners = [];
    var _deferreds = [];
    var _subContext = null;
    var _settings = {
      'schemes': ['./foo/{{resource}}.lol', './locales/{{locale}}/{{resource}}.lol'],
      'locales': ['pl', 'en-US'],
    };
    this.settings = _settings;




    function get(id) {
      var entity = _entries[id];
      if (!entity) {
        if (_settings.locales < 2) {
          throw "No more locales";
        }
        var sc = getSubContext();
        entity = sc.get(id);
      }
      return entity.toString();
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
        var source = downloadSync(uri);
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
        downloadAsync(uri).then(
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
          L20n.Compiler.compile(_resource.ast, _entries, _globals);
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
  };
  
  function downloadAsync(url) {
    url = L20n.env.getURL(url);
    var deferred = when.defer();
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType('text/plain');
    xhr.addEventListener('load', function() {
      if (xhr.status == 200) {
        deferred.resolve(xhr.responseText);
      } else {
        deferred.reject();
      }
    });
    xhr.addEventListener('abort', function(e) {
      return when.reject(e);
    });
    xhr.open('GET', url, true);
    xhr.send('');
    return deferred.promise;
  }

  function downloadSync(url) {
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType('text/plain');
    xhr.open('GET', url, false);
    xhr.send('');
    if (xhr.status == 200) {
      return xhr.responseText;
    } else {
      return false;
    }
  }


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
      return [uri];
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
    return _expandUrn(scheme, vars);
  }
  function resolveURI2(uri, locale, schemes) {
    if (!/^l10n:/.test(uri)) {
      return [uri];
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
    var uris = [];
    for (var i in schemes) {
      var expanded = _expandUrn(schemes[i], vars);
      uris.push(expanded);
    }
    return uris;
  }


  this.L20n = L20n;

}).call(this);
