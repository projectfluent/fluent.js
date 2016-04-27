import AST from './ast';

import { L10nError } from '../../../errors';

export default {
  serialize: function(body) {
    let string = '';
    for (const entry of body) {
      string += this.dumpEntry(entry) + '\n';
    }
    return string;
  },

  dumpEntry: function(entry) {
    switch (entry.type) {
      case 'Entity':
        return this.dumpEntity(entry);
      case 'Comment':
        return this.dumpComment(entry) + '\n';
      case 'Section':
        return this.dumpSection(entry);
    }
  },

  dumpEntity: function(entity) {
    let str = '';

    if (entity.comment) {
      str += this.dumpComment(entity.comment) + '\n';
    }
    let id = this.dumpIdentifier(entity.id);
    let value = this.dumpPattern(entity.value);

    if (entity.traits.length) {
      let traits = this.dumpMembers(entity.traits, 2);
      str += `${id} = ${value}\n${traits}`;
    } else {
      str += `${id} = ${value}`;
    }
    return str;
  },

  dumpComment: function(comment) {
    return '# ' + comment.content.replace(/\n/g, '\n# ');
  },

  dumpSection: function(section) {
    let str = '';
    if (section.comment) {
      str += this.dumpComment(section.comment) + '\n';
    }
    return str + `[[ ${this.dumpIdentifier(section.name)} ]]`;
  },

  dumpIdentifier: function(id) {
    if (id.namespace) {
      return `${id.namespace}/${id.name}`;
    }
    return id.name;
  },

  dumpPattern: function(pattern) {
    if (pattern === null) {
      return '';
    }
    if (pattern._quoteDelim) {
      return `"${pattern.source}"`;
    }
    let str = '';

    pattern.elements.forEach(elem => {
      if (elem.type === 'TextElement') {
        if (elem.value.includes('\n')) {
          str += '\n  | ' + elem.value.replace(/\n/g, '\n  | ');
        } else {
          str += elem.value;
        }
      } else if (elem.type === 'Placeable') {
        str += this.dumpPlaceable(elem);
      }
    });
    return str;
  },

  dumpPlaceable: function(placeable) {
    let source = placeable.expressions.map(exp => {
      return this.dumpExpression(exp);
    }).join(', ');

    if (source.endsWith('\n')) {
      return `{ ${source}}`;
    }
    return `{ ${source} }`;
  },

  dumpExpression: function(exp) {
    switch (exp.type) {
      case 'Identifier':
      case 'BuiltinReference':
      case 'EntityReference':
        return this.dumpIdentifier(exp);
      case 'ExternalArgument':
        return `$${this.dumpIdentifier(exp)}`;
      case 'SelectExpression':
        let sel = this.dumpExpression(exp.expression);
        let variants = this.dumpMembers(exp.variants, 2);
        return `${sel} ->\n${variants}\n`;
      case 'CallExpression':
        let id = this.dumpExpression(exp.callee);
        let args = this.dumpCallArgs(exp.args);
        return `${id}(${args})`;
      case 'Pattern':
        return this.dumpPattern(exp);
      case 'Number':
        return exp.value;
      case 'MemberExpression':
        let obj = this.dumpExpression(exp.object);
        let key = this.dumpExpression(exp.keyword);
        return `${obj}[${key}]`;
    }
  },

  dumpCallArgs: function(args) {
    return args.map(arg => {
      if (arg instanceof AST.KeyValueArg) {
        return `${arg.name}:${this.dumpExpression(arg.value)}`;
      }
      return this.dumpExpression(arg);
    }).join(', ');
  },

  dumpMembers: function(members, indent) {
    return members.map(member => {
      let key = this.dumpExpression(member.key);
      let value = this.dumpPattern(member.value);
      let prefix = member.default ?
        `${' '.repeat(indent - 1)}*` :
        `${' '.repeat(indent)}`;
      return `${prefix}[${key}] ${value}`;
    }).join('\n');
  }
}
