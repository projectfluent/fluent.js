(function() {
  'use strict';


  var L20n = {
    getContext: function L20n_getContext() {
      return new Context();
    },
  };

  function Context() {

    var mData = {};
    var mIsFrozen;
    var listener; 

    function get(aId) {
      //var data = {};

      return "I'm a string!";
      //return mData;
    }

    this.data = {};
    this.settings = {};
    this.isFrozen = {};

    this.addResource = function() {};
    this.freeze = function() {
      listener();

    this.get = get;
    this.getEntity = function() {};
    this.getAttribute = function() {};

    this.addEventListener = function(type, listener) {
      listener = listener;
    };
    this.removeEventListener = function() {};


    var mData = {};
    var mURIs = [];
    var mIsFrozen = false;
    var mAST = null;
    var mParser = new L20n.Parser();
    var mEntries = {};
    var mGlobals = {};
    var mListeners = [];

    function get(aId) {
      var entity = mEntries[aId];
      return entity.toString();
    }

    function addResource(uri) {
      mURIs.push(uri);
      downloadAsync(uri).then(
        function(source) {
          mAST = mParser.parse(source);
          L20n.Compiler.compile(mAST, mEntries, mGlobals);
          console.log(mAST);
          mListeners[0](this);
        },
        function() {}
      );
      return this;
    }

    function freeze() {
      mIsFrozen = true;
      return this;
    }

    function addEventListener(type, listener) {
      mListeners.push(listener);
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
