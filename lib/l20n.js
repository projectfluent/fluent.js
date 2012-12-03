(function() {
  'use strict';


  var L20n = {
    getContext: function L20n_getContext() {
      return new Context();
    },
  };

  function Resource(uri) {
    this.source = '';
    this.ast = [];
    this.uri = uri;
    this.resources = [];
    this.isReady = false;
  }

  function Context() {

    this.data = {};
    this.isFrozen = {};

    this.addResource = addResource;
    this.freeze = freeze;

    this.get = get;
    this.getEntity = function() {};
    this.getAttribute = function() {};

    this.addEventListener = addEventListener;
    this.removeEventListener = function() {};


    var mData = {};
    var mIsFrozen = false;
    var mResource = new Resource(null);
    var mParser = new L20n.Parser();
    var mEntries = {};
    var mGlobals = {};
    var mEmitter = new L20n.EventEmitter();
    var mListeners = [];
    var mDeferreds = [];
    var mSubContext = null;
    var mSettings = {
      'schemes': ['./locales/{{locale}}/{{resource}}'],
      'locales': ['en-US', 'pl'],
    };
    this.settings = mSettings;

    function get(aId) {
      var entity = mEntries[aId];
      if (!entity) {
        var sc = getSubContext();
        console.log(sc);
        entity = sc.get(aId);
      }
      return entity.toString();
    }


    function loadURI(uri) {
      downloadAsync(uri).then(
          function gotIt(source) {
            deferred.resolve(source);
          },
          function doh() {
            deferred.fail();
          }
      );
    }

    function loadURIs(uris) {
      var deferred = when.defer();
      loadURI(uris.shift()).then(
      function ok(){
        return deferred.resolve();
      },
      function fail() {
        if (uris.length==0)
          deferred.fail();
        loadURIs(uris).then(function() {
          return deferred.resolve();
        },
        function() {
          return deferred.fail();
        });
      });
      return deferred.promise;
    }

    function resolveResource(res) {
      when.all(res.resources).then(
        function success() {
          for sub(res in res.resources) {
            res.ast = subres.ast.concat(res.ast);
          }
          res.isReady = true;
        }
      );
    }

    function loadResource(uri, sync, depth) {
      var deferred = when.defer();
      var uris = resolveURI(uri, mSettings.locales[0], mSettings.schemes);
      loadURIs(uris).then(function() {
        var res = new Resource(uri);
        res.ast = mParser.parse(source).body;
        deferred.resolve(res);
      }
      return deferred.promise;
    }

    function addResource(uri, sync) {
      mResource.resources.push(loadResource(uri));
      return this;
    }

    

    function freeze() {
      mIsFrozen = true;
      resolveResource(mResource).then(function() {
        L20n.Compiler.compile(res.ast, mEntries, mGlobals);
        mEmitter.emit('ready');
      });
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
      mEmitter.addEventListener(type, listener);
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
