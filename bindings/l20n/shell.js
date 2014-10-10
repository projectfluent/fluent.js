'use strict';

/* global Context, PropertiesParser, getPluralRule, Resolver */

window.L20n = {
  Context: Context,
  PropertiesParser: PropertiesParser,
  getPluralRule: getPluralRule,
  getContext: function L20n_getContext(id) {
    return new Context(id);
  },
  createEntries: function(ast) {
    var entries = Object.create(null);
    for (var i = 0, len = ast.length; i < len; i++) {
      entries[ast[i].$i] = Resolver.createEntry(ast[i], entries);
    }
    return entries;
  },
  Resolver: Resolver
};
