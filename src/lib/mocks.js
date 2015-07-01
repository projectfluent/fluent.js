'use strict';

import PropertiesParser from './format/properties/parser';
import { createEntry } from './resolver';
import { getPluralRule } from './plurals';

export const lang = {
  code:'en-US',
  src: 'app',
  dir: 'ltr'
};

export function createEntriesFromAST(ast) {
  let entries = Object.create(null);
  for (let i = 0, node; (node = ast[i]); i++) {
    entries[node.$i] = createEntry(node);
  }
  return entries;
}

export function createEntriesFromSource(source) {
  const ast = PropertiesParser.parse(null, source);
  return createEntriesFromAST(ast);
}

export function MockContext(entries) {
  this._getEntity = function(lang, id) {
    return entries[id];
  };

  this._getMacro = function(lang, id) {
    switch(id) {
      case 'plural':
        return getPluralRule(lang.code);
      default:
        return undefined;
    }
  };
}
