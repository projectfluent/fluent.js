'use strict';

/* global Context, PropertiesParser, Entity, getPluralRule */

window.L20n = {
  Context: Context,
  PropertiesParser: PropertiesParser,
  getPluralRule: getPluralRule,
  getContext: function L20n_getContext(id) {
    return new Context(id);
  },
  compile: function compile(ast, env) {
    for (var id in ast) {
      env[id] = new Entity(id, ast[id], env);
    }
  },
};
