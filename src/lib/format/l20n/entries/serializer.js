'use strict';

/* jshint -W089 */
/* jshint -W069 */

export default function() {
  this.serialize = function (ast) {
    var string = '';
    for (var id in ast) {
      string += dumpEntry(ast[id]) + '\n';
    }

    return string;
  };

  function dumpEntry(entry) {
    return dumpEntity(entry);
  }

  function dumpEntity(entity) {
    var id, val = null, attrs = {};
    var index = '';

    for (var key in entity) {
      switch (key) {
        case '$v':
          val = entity.$v;
          break;
        case '$x':
          index = dumpIndex(entity.$x);
          break;
        case '$i':
          id = entity.$i.replace(/-/g, '_');
          break;
        default:
          attrs[key] = entity[key];
      }
    }

    if (Object.keys(attrs).length === 0) {
      return '<' + id + index + ' ' + dumpValue(val, 0) + '>';
    } else {
      return '<' + id + index + ' ' + dumpValue(val, 0) +
        '\n' + dumpAttributes(attrs) + '>';
    }
  }

  function dumpIndex(index) {
    if (index[0].v === 'plural') {
      return '[ @cldr.plural($' + index[1] + ') ]';
    }
  }

  function dumpValue(value, depth) {
    if (value === null) {
      return '';
    }
    if (typeof value === 'string') {
      return dumpString(value);
    }
    if (Array.isArray(value)) {
      return dumpComplexString(value);
    }
    if (typeof value === 'object') {
      if (value.$o) {
        return dumpValue(value.$o);
      }
      return dumpHash(value, depth);
    }
  }

  function dumpString(str) {
    if (str) {
      return '"' + str.replace(/"/g, '\\"') + '"';
    }
    return '';
  }

  function dumpComplexString(chunks) {
    var str = '"';
    for (var i = 0; i < chunks.length; i++) {
      if (typeof chunks[i] === 'string') {
        str += chunks[i];
      } else {
        str += '{{ ' + chunks[i].v.replace(/-/g, '_') + ' }}';
      }
    }
    return str + '"';
  }

  function dumpHash(hash, depth) {
    var items = [];
    var str;

    for (var key in hash) {
      str = '  ' + key + ': ' + dumpValue(hash[key]);
      items.push(str);
    }

    var indent = depth ? '  ' : '';
    return '{\n' + indent + items.join(',\n' + indent) + '\n'+indent+'}';
  }

  function dumpAttributes(attrs) {
    var str = '';
    for (var key in attrs) {
      if (attrs[key].$x) {
        str += '  ' + key + dumpIndex(attrs[key].$x) + ': ' +
          dumpValue(attrs[key].$v, 1) + '\n';
      } else {
        str += '  ' + key + ': ' + dumpValue(attrs[key], 1) + '\n';
      }
    }

    return str;
  }
}
