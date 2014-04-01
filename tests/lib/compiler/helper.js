'use strict';

var parse = require('../../../lib/l20n/parser').parse;
var Entity = process.env.L20N_COV
  ? require('../../../build/cov/lib/l20n/compiler').Entity
  : require('../../../lib/l20n/compiler').Entity;
var getPluralRule = require('../../../lib/l20n/plurals').getPluralRule;

exports.compile = function compile(source) {
  var env = {
    __plural: getPluralRule('en-US')
  };
  var ast = parse(null, source);
  for (var id in ast) {
    if (ast.hasOwnProperty(id)) {
      env[id] = new Entity(id, ast[id], env);
    }
  }
  return env;
}
