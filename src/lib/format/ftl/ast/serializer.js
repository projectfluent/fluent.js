import AST from './ast';

import { L10nError } from '../../../errors';

export default {
  serialize: function(ast) {
    let string = '';
    for (const id in ast.body) {
      string += this.dumpEntry(ast.body[id]) + '\n';
    }
    return string;
  },

  dumpEntry: function(entry) {
    return this.dumpEntity(entry);
  },

  dumpEntity: function(entity) {
    let id = this.dumpIdentifier(entity.id);
    let value = this.dumpPattern(entity.value);

    return `${id} = ${value}`;
  },

  dumpIdentifier: function(id) {
    return id.name;
  },

  dumpPattern: function(pattern) {
    return pattern.source;
  },
}
