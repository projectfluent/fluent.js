if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports, module) {
  'use strict';

  var Context = require('./l20n/context').Context;

  exports.getContext = function L20n_getContext(id) {
      return new Context(id);
  };

});
