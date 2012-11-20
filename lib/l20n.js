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
    };

    this.get = get;
    this.getEntity = function() {};
    this.getAttribute = function() {};

    this.addEventListener = function(type, listener) {
      listener = listener;
    };
    this.removeEventListener = function() {};
  };
  
  // expose to public
  this.L20n = L20n;

}).call(this);
