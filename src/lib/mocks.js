/*eslint no-shadow: [1, { "allow": ["lang"] }]*/

import { Context } from './context';

export const lang = {
  code:'en-US',
  src: 'app',
};

export function MockContext(entries) {
  return {
    env: {},
    _getEntity(lang, {namespace, name}) {
      const id = `${namespace || ''}:${name}`;
      return entries[id];
    },
    _memoizeIntlObject: Context.prototype._memoizeIntlObject,
  };
}
