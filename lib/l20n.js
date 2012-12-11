(function() {
  'use strict';


  var L20n = {
    getContext: function L20n_getContext(id) {
      return new Context(id);
    },
  };

  function Resource(uri) {
    this.source = '';
    this.ast = [];
    this.uri = uri;
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
    var _deferrers = [];
    var _subContext = null;
    var _settings = {
      'schemes': ['./locales/{{locale}}/{{resource}}'],
      'locales': ['en-US', 'pl'],
    };
    this.settings = _settings;




    function get(id) {
      var entity = _entries[id];
      if (!entity) {
        var sc = getSubContext();
        console.log(sc);
        entity = sc.get(id);
      }
      return entity.toString();
    }

    function loadResource(uri, sync) {
      if (!sync) {
        var deferred = when.defer();
      }
      var uri = resolveURI(uri, _settings.locales[0], _settings.schemes);
      var res = new Resource(uri);
      _resource.resources.push(res);
      if (sync) {
        downloadSync(uri);
      } else {
        downloadAsync(uri).then(
            function gotIt(source) {
            },
            function doh() {
              red.isReady = 'niebardzo';
              deferred.resolve();
            }
            );
        return deferred.promise;
      }
    }

    function injectResource(id, source) {
      var res = new Resource(id);
      res.ast = _parser.parse(source).body;
      res.isReady = true;
      _resource.resources.push(res);
    }

    function addResource(uri, sync) {
      if (sync) {
        loadResource(uri, true);
      } else {
        _deferrers.push(loadResource(uri));
      }
      return this;
    }

    function freeze() {
      _isFrozen = true;
      when.all(_deferrers).then(
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
    if (mSubContext === null) {
      mSubContext = new Context();
      mSubContext.settings.locales = mSettings.locales.slice(1);
      for (var i in mResources) {
        mSubContext.addResource(mResources[i].uri, true);
      }
      console.log('building');
      mSubContext.freeze();
    }
    return mSubContext;
  }
    function addEventListener(type, listener) {
      _emitter.addEventListener(type, listener);
    }
  };
  
  function downloadAsync(url) {
    var deferred = when.defer();
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType('text/plain');
    xhr.addEventListener('load', function() {
      deferred.resolve(xhr.responseText);
    });
    xhr.addEventListener('error', function(e) {
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

  function resolveURI(uri, locale, schemes) {
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
