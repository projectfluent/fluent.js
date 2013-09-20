if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports) {
  'use strict';

  var Context = require('./l20n/context').Context;
  var Parser = require('./l20n/parser').Parser;
  var Compiler = require('./l20n/compiler').Compiler;

  exports.Context = Context;
  exports.Parser = Parser;
  exports.Compiler = Compiler;
  exports.getContext = function L20n_getContext(id) {
      return new Context(id);
  };

});
