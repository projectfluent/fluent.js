'use strict';

var Context = require('./l20n/context').Context;
var PropertiesParser =
  require('./l20n/format/properties/parser').PropertiesParser;
var getPluralRule = require('./l20n/plurals').getPluralRule;
var Resolver = require('./l20n/resolver');

exports.Context = Context;
exports.PropertiesParser = PropertiesParser;
exports.getPluralRule = getPluralRule;
exports.getContext = function L20n_getContext(id) {
    return new Context(id);
};
exports.Resolver = Resolver;
exports.createEntities = function compile(ast) {
  var entries = Object.create(null);
  /* jshint -W089 */
  for (var id in ast) {
    entries[id] = Resolver.createEntity(id, ast[id], entries);
  }
  return entries;
};
