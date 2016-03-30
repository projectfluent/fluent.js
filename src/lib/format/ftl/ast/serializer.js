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

    if (entity.traits.length) {
      let traits = this.dumpTraits(entity.traits, 2);
      return `${id} = ${value}\n${traits}`;
    } else {
      return `${id} = ${value}`;
    }
  },

  dumpIdentifier: function(id) {
    if (id.namespace) {
      return `${id.namespace}:${id.name}`;
    }
    return id.name;
  },

  dumpPattern: function(pattern) {
    return pattern.source;
  },

  dumpTraits: function(traits, indent) {
    return traits.map(trait => {
      let id = this.dumpIdentifier(trait.key);
      let value = this.dumpPattern(trait.value);
      return `${' '.repeat(indent)}[${id}] ${value}`;
    }).join('\n');
  }
}
