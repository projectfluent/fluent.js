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
    this.settings = {};
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
    var mDeferrers = [];

    function get(aId) {
      var entity = mEntries[aId];
      return entity.toString();
    }

    function loadResource(uri) {
      var deferred = when.defer();
      var res = new Resource(uri);
      mResource.resources.push(res);
      downloadAsync(uri).then(
        function gotIt(source) {
          res.ast = mParser.parse(source).body;
          res.isReady = true;
          mResource.ast = mResource.ast.concat(res.ast);
          deferred.resolve();
        },
        function doh() {}
      );
      return deferred.promise;
    }

    function addResource(uri) {
      mDeferrers.push(loadResource(uri));
      return this;
    }

    function freeze() {
      mIsFrozen = true;
      when.all(mDeferrers).then(
        function freeze_success() {
          mResource.isReady = true;
          L20n.Compiler.compile(mResource.ast, mEntries, mGlobals);
          mEmitter.emit('ready');
        }
      );
      return this;
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


  this.L20n = L20n;

}).call(this);
