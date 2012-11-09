(function() {
  'use strict';

  var L20n = this.L20n = {
    getContext: function L20n_getContext() {
      return new Context();
    },
    invalidateCache: function L20n_invalidateCache() {
      return resCache.invalidate();
    }
  };

  function Context() {
    return {
      /* Public properties */
      data: {},
      settings: {},


      /* Public methods */
      getLocale: function() {},
      invalidateCache: function() {},
      addResource: function() {},
      freeze: function() {},

      get: function() {},
      getEntity: function() {},
      getAttribute: function() {},

      addEventListener: function ctx_addEventListener(type, listener) {
        return emitter.addEventListener(type, listener);
      },
      removeEventListener: function ctx_removeEventListener(type, listener) {
        return emitter.removeEventListener(type, listener)
      }
    }
  }
}).call(this);
