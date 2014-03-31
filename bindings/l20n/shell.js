'use strict';

/* global Context, Parser, Entity, getPluralRule */

window.L20n = {
  Context: Context,
  Parser: Parser,
  getPluralRule: getPluralRule,
  getContext: function L20n_getContext(id) {
    return new Context(id);
  },
  compile: function compile(ast, env) {
    for (var id in ast) {
      if (ast.hasOwnProperty(id)) {
        env[id] = new Entity(id, ast[id], env);
      }
    }
  },
};
