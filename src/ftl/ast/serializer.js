import { L10nError } from '../../lib/errors';

export default {
  serialize: function({body, comment}) {
    let string = '';
    if (comment !== null) {
      string += `${this.dumpComment(comment)}\n\n`;
    }
    for (const entry of body) {
      string += this.dumpEntry(entry);
    }
    return string;
  },

  dumpEntry: function(entry) {
    switch (entry.type) {
      case 'Entity':
        return `${this.dumpEntity(entry)}\n`;
      case 'Comment':
        return `${this.dumpComment(entry)}\n\n`;
      case 'Section':
        return `${this.dumpSection(entry)}\n`;
      case 'JunkEntry':
        return '';
      default:
        throw new L10nError('Unknown entry type.');
    }
  },

  dumpEntity: function(entity) {
    let str = '';

    if (entity.comment) {
      str += `\n${this.dumpComment(entity.comment)}\n`;
    }

    const id = this.dumpIdentifier(entity.id);
    str += `${id} =`;

    if (entity.value) {
      const value = this.dumpPattern(entity.value);
      str += ` ${value}`;
    }

    if (entity.traits.length) {
      const traits = this.dumpMembers(entity.traits, 2);
      str += `\n${traits}`;
    }

    return str;
  },

  dumpComment: function(comment) {
    return `# ${comment.content.replace(/\n/g, '\n# ')}`;
  },

  dumpSection: function(section) {
    let str = '\n\n';
    if (section.comment) {
      str += `${this.dumpComment(section.comment)}\n`;
    }
    str += `[[ ${this.dumpKeyword(section.key)} ]]\n\n`;

    for (const entry of section.body) {
      str += this.dumpEntry(entry);
    }
    return str;
  },

  dumpIdentifier: function(id) {
    return id.name;
  },

  dumpKeyword: function(kw) {
    if (kw.namespace) {
      return `${kw.namespace}/${kw.name}`;
    }
    return kw.name;
  },

  dumpPattern: function(pattern) {
    if (pattern === null) {
      return '';
    }

    let str = '';

    pattern.elements.forEach(elem => {
      if (elem.type === 'TextElement') {
        if (elem.value.includes('\n')) {
          str += `\n  | ${elem.value.replace(/\n/g, '\n  | ')}`;
        } else {
          str += elem.value;
        }
      } else if (elem.type === 'Placeable') {
        str += this.dumpPlaceable(elem);
      }
    });

    if (pattern.quoted) {
      return `"${str.replace('"', '\\"')}"`;
    }

    return str;
  },

  dumpPlaceable: function(placeable) {
    const source = placeable.expressions.map(exp => {
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
      case 'FunctionReference':
      case 'EntityReference':
        return this.dumpIdentifier(exp);
      case 'ExternalArgument':
        return `$${this.dumpIdentifier(exp)}`;
      case 'SelectExpression':
        const sel = this.dumpExpression(exp.expression);
        const variants = this.dumpMembers(exp.variants, 2);
        return `${sel} ->\n${variants}\n`;
      case 'CallExpression':
        const id = this.dumpExpression(exp.callee);
        const args = this.dumpCallArgs(exp.args);
        return `${id}(${args})`;
      case 'Pattern':
        return this.dumpPattern(exp);
      case 'Number':
        return exp.value;
      case 'Keyword':
        return this.dumpKeyword(exp);
      case 'MemberExpression':
        const obj = this.dumpExpression(exp.object);
        const key = this.dumpExpression(exp.keyword);
        return `${obj}[${key}]`;
      default:
        throw new L10nError(`Unknown expression type ${exp.type}`);
    }
  },

  dumpCallArgs: function(args) {
    return args.map(arg => {
      if (arg.type === 'KeyValueArg') {
        return `${arg.name}: ${this.dumpExpression(arg.value)}`;
      }
      return this.dumpExpression(arg);
    }).join(', ');
  },

  dumpMembers: function(members, indent) {
    return members.map(member => {
      const key = this.dumpExpression(member.key);
      const value = this.dumpPattern(member.value);
      const prefix = member.default ?
        `${' '.repeat(indent - 1)}*` :
        `${' '.repeat(indent)}`;
      return `${prefix}[${key}] ${value}`;
    }).join('\n');
  }
};
