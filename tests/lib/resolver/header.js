'use strict';

import PropertiesParser from '../../../src/lib/format/properties/parser';
import { createEntry } from '../../../src/lib/resolver';
import { getPluralRule } from '../../../src/lib/plurals';

export { format } from '../../../src/lib/resolver';

export const lang = {
  code:'en-US',
  src: 'app',
  dir: 'ltr'
};

export function createEntries(source) {
  /* jshint -W089 */
  var entries = Object.create(null);
  var ast = PropertiesParser.parse(null, source);

  for (var i = 0, len = ast.length; i < len; i++) {
    entries[ast[i].$i] = createEntry(ast[i], lang);
  }

  return entries;
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
