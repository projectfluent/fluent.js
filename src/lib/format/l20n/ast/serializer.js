'use strict';

import { L10nError } from '../../../errors';

export default {
  serialize: function(ast) {
    var string = '';
    for (var id in ast) {
      string += this.dumpEntry(ast[id]) + '\n';
    }
    return string;
  },

  serializeString: function(ast) {
    let string = '';

    if (typeof(ast) === 'object') {
      string += this.dumpValue(ast, 0);
    } else {
      string += this.dumpString(ast);
    }

    return string;
  },

  dumpEntry: function(entry) {
    return this.dumpEntity(entry);
  },

  dumpEntity: function(entity) {
    var id, val = null, attrs = {};
    var index = '';

    for (var key in entity) {
      switch (key) {
        case '$v':
          val = entity.$v;
          break;
        case '$x':
          index = this.dumpIndex(entity.$x);
          break;
        case '$i':
          id = this.dumpIdentifier(entity.$i);
          break;
        default:
          attrs[key] = entity[key];
      }
    }

    if (Object.keys(attrs).length === 0) {
      return '<' + id + index + ' ' + this.dumpValue(val, 0) + '>';
    } else {
      return '<' + id + index + ' ' + this.dumpValue(val, 0) +
        '\n' + this.dumpAttributes(attrs) + '>';
    }
  },

  dumpIdentifier: function(id) {
    return id.replace(/-/g, '_');
  },

  dumpValue: function(value, depth) {
    if (value === null) {
      return '';
    }

    // tl;dr - unescaping is a bitch
    //
    // we need to figure out the rules so that we can reescape
    // when we serialize
    if (typeof value === 'string') {
      return this.dumpString(value);
    }
    if (Array.isArray(value)) {
      return this.dumpComplexString(value);
    }
    if (typeof value === 'object') {
      if (value.o) {
        return this.dumpValue(value.v);
      }
      return this.dumpHash(value, depth);
    }
  },

  dumpString: function(str) {
    if (str) {
      return '"' + str.replace(/"/g, '\\"') + '"';
    }
    return '';
  },

  dumpComplexString: function(chunks) {
    var str = '"';
    for (var i = 0; i < chunks.length; i++) {
      if (typeof chunks[i] === 'string') {
        str += chunks[i].replace(/"/g, '\\"');
      } else {
        str += '{{ ' + this.dumpExpression(chunks[i]) + ' }}';
      }
    }
    return str + '"';
  },

  dumpAttributes: function(attrs) {
    var str = '';
    for (var key in attrs) {
      if (attrs[key].x) {
        str += '  ' + key + this.dumpIndex(attrs[key].x) + ': ' +
          this.dumpValue(attrs[key].v, 1) + '\n';
      } else {
        str += '  ' + key + ': ' + this.dumpValue(attrs[key], 1) + '\n';
      }
    }

    return str;
  },

  dumpExpression: function(exp) {
    switch (exp.t) {
      case 'call':
        return this.dumpCallExpression(exp);
      case 'prop':
        return this.dumpPropertyExpression(exp);
    }

    return this.dumpPrimaryExpression(exp);
  },

  dumpPropertyExpression: function(exp) {
    const idref = this.dumpExpression(exp.e);
    let prop;

    if (exp.c) {
      prop = this.dumpExpression(exp.p);
      return idref + '[' + prop + ']';
    }

    prop = this.dumpIdentifier(exp.p);
    return idref + '.' + prop;
  },

  dumpCallExpression: function(exp) {
    var pexp = this.dumpExpression(exp.v);

    var attrs = this.dumpItemList(exp.a, this.dumpExpression.bind(this));
    pexp += '(' + attrs + ')';
    return pexp;
  },

  dumpPrimaryExpression: function(exp) {
    var ret = '';

    if (typeof(exp) === 'string') {
      return exp;
    }

    switch (exp.t) {
      case 'glob':
        ret += '@';
        ret += exp.v;
        break;
      case 'var':
        ret += '$';
        ret += exp.v;
        break;
      case 'id':
        ret += this.dumpIdentifier(exp.v);
        break;
      case 'idOrVar':
        ret += this.dumpIdentifier(exp.v);
        break;
      default:
        throw new L10nError('Unknown primary expression');
    }

    return ret;
  },

  dumpHash: function(hash, depth) {
    var items = [];
    var str;

    var defIndex;
    if ('__default' in hash) {
      defIndex = hash.__default;
    }

    for (var key in hash) {
      let indent = '  ';
      if (key.charAt(0) === '_' && key.charAt(1) === '_') {
        continue;
      }

      if (key === defIndex) {
        indent = ' *';
      }
      str = indent + key + ': ' + this.dumpValue(hash[key], depth + 1);
      items.push(str);
    }

    let indent = new Array(depth + 1).join('  '); // str.repeat
    return '{\n' + indent + items.join(',\n' + indent) + '\n'+indent+'}';
  },

  dumpItemList: function(itemList, cb) {
    return itemList.map(cb).join(', ');
  },

  dumpIndex: function(index) {
    return '[' + this.dumpItemList(index, this.dumpExpression.bind(this)) + ']';
  },
};
