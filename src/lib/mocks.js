/*eslint no-shadow: [1, { "allow": ["lang"] }]*/

import { Context } from './context';

export const lang = {
  code:'en-US',
  src: 'app',
};

export function MockContext(entries) {
  return {
    env: {},
    _getEntity(lang, name) {
      return entries[name];
    },
    _memoizeIntlObject: Context.prototype._memoizeIntlObject,
  };
}
