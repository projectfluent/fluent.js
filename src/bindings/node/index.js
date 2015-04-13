'use strict';

var Context = require('../../lib/context').Context;
var PropertiesParser =
  require('../../lib/format/properties/parser');
var getPluralRule = require('../../lib/plurals').getPluralRule;
var Resolver = require('../../lib/resolver');

exports.Context = Context;
exports.PropertiesParser = PropertiesParser;
exports.getPluralRule = getPluralRule;
exports.getContext = function L20n_getContext(id) {
    return new Context(id);
};
exports.Resolver = Resolver;
exports.extendEntries = function(entries, ast) {
  for (var i = 0, len = ast.length; i < len; i++) {
    entries[ast[i].$i] = Resolver.createEntry(ast[i], entries);
  }
};
