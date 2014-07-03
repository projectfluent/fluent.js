'use strict';

var Context = require('./l20n/context').Context;
var PropertiesParser =
  require('./l20n/format/properties/parser').PropertiesParser;
var Entity = require('./l20n/compiler').Entity;
var getPluralRule = require('./l20n/plurals').getPluralRule;

exports.Context = Context;
exports.PropertiesParser = PropertiesParser;
exports.getPluralRule = getPluralRule;
exports.getContext = function L20n_getContext(id) {
    return new Context(id);
};
exports.compile = function compile(ast, env) {
  /* jshint -W089 */
  for (var id in ast) {
    env[id] = new Entity(id, ast[id], env);
  }
};
