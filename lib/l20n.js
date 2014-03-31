'use strict';

var Context = require('./l20n/context').Context;
var Parser = require('./l20n/parser').Parser;
var Entity = require('./l20n/compiler').Entity;
var getPluralRule = require('./l20n/plurals').getPluralRule;

exports.Context = Context;
exports.Parser = Parser;
exports.getPluralRule = getPluralRule;
exports.getContext = function L20n_getContext(id) {
    return new Context(id);
};
exports.compile = function compile(ast, env) {
  for (var id in ast) {
    if (ast.hasOwnProperty(id)) {
      env[id] = new Entity(id, ast[id], env);
    }
  }
};
