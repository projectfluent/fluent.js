define(function (require, exports, module) {
  'use strict';

  var L20n = require('../l20n');
  L20n.Context = require('../l20n/context').Context;
  L20n.Parser = require('../l20n/parser').Parser;
  L20n.Compiler = require('../l20n/compiler').Compiler;
  L20n.getPluralRule = require('../l20n/plurals').getPluralRule;

  return L20n;

});
