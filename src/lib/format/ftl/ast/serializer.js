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
    if (entry instanceof AST.Entity) {
      return this.dumpEntity(entry);
    } else if (entry instanceof AST.Comment) {
      return this.dumpComment(entry) + '\n';
    } else if (entry instanceof AST.Section) {
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
      let traits = this.dumpTraits(entity.traits, 2);
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
      if (elem instanceof AST.TextElement) {
        if (elem.value.includes('\n')) {
          str += '\n  | ' + elem.value.replace(/\n/g, '\n  | ');
        } else {
          str += elem.value;
        }
      } else if (elem instanceof AST.Placeable) {
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
    if (exp instanceof AST.ExternalArgument) {
      return `$${exp.name}`;
    }
    if (exp instanceof AST.BuiltinReference) {
      return exp.name;
    }
    if (exp instanceof AST.EntityReference) {
      return this.dumpIdentifier(exp);
    }
    if (exp instanceof AST.SelectExpression) {
      let sel = this.dumpExpression(exp.expression);
      let traits = this.dumpTraits(exp.variants, 2);
      return `${sel} ->\n${traits}\n`;
    }
    if (exp instanceof AST.CallExpression) {
      let id = this.dumpExpression(exp.callee);
      let args = this.dumpCallArgs(exp.args);
      return `${id}(${args})`;
    }
    if (exp instanceof AST.Pattern) {
      return this.dumpPattern(exp);
    }
    if (exp instanceof AST.Number) {
      return exp.value;
    }
    if (exp instanceof AST.MemberExpression) {
      let obj = this.dumpExpression(exp.object);
      let key = this.dumpExpression(exp.keyword);
      return `${obj}[${key}]`;
    }
    if (exp instanceof AST.Identifier) {
      return this.dumpIdentifier(exp);
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

  dumpTraits: function(traits, indent) {
    return traits.map(trait => {
      let id = this.dumpIdentifier(trait.key);
      let value = this.dumpPattern(trait.value);
      let def = trait.default ? '*' : '';
      return `${' '.repeat(indent)}${def}[${id}] ${value}`;
    }).join('\n');
  }
}
