'use strict';

/* global Context, PropertiesParser, getPluralRule, Resolver */

window.L20n = {
  Context: Context,
  PropertiesParser: PropertiesParser,
  getPluralRule: getPluralRule,
  getContext: function L20n_getContext(id) {
    return new Context(id);
  },
  createEntities: function compile(ast) {
    var entries = Object.create(null);
    for (var id in ast) {
      entries[id] = Resolver.createEntity(id, ast[id], entries);
    }
    return entries;
  },
  Resolver: Resolver
};
