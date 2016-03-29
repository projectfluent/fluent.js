/*eslint no-shadow: [1, { "allow": ["lang"] }]*/

import FTLParser from './format/ftl/ast/parser';
import { Context } from './context';

function toEntries([entries, curSection], entry) {
  if (entry.type === 'Section') {
    return [entries, entry.name];
  }

  if (curSection && !entry.ns) {
    entry.ns = curSection;
  }

  return [
    Object.assign(entries, {
      [getId(entry)]: entry
    }),
    curSection
  ];
}

function getId(entry) {
  return `${entry.id.namespace || ''}:${entry.id.name}`;
}

export const lang = {
  code:'en-US',
  src: 'app',
};

export function createEntriesFromSource(source) {
  const ast = FTLParser.parseResource(source);
  return createEntriesFromAST(ast);
}

export function createEntriesFromAST(ast) {
  const [entries] = ast.body
    .filter(entry => entry.type === 'Entity' || entry.type === 'Section')
    .reduce(toEntries, [{}, null]);
  return entries;
}

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
