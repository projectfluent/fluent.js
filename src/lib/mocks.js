/*eslint no-shadow: [1, { "allow": ["lang"] }]*/

import PropertiesParser from './format/properties/parser';
import { getPluralRule } from './plurals';

export const lang = {
  code:'en-US',
  src: 'app',
};

export function createEntriesFromSource(source) {
  return PropertiesParser.parse(null, source);
}

export function MockContext(entries) {
  this._getNumberFormatter = function() {
    return {
      format: function(value) {
        return value;
      }
    };
  };
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
