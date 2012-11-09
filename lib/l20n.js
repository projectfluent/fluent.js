(function() {
  'use strict';

  var L20n = {
    getContext: function L20n_getContext() {
      return new Context();
    },
  };

  function Context() {

    var mData = {};
    var mIsFrozen

    function get(aId) {
      var data = {};

      return mData;
    }

    this.data = {};
    this.settings = {};
    this.isFrozen = {};

    this.addResource = function() {};
    this.freeze = function() {};

    this.get = get;
    this.getEntity = function() {};
    this.getAttribute = function() {};

    this.addEventListener = function() {};
    this.removeEventListener = function() {};
  };
  
  // expose to public
  this.L20n = L20n;

}).call(this);
