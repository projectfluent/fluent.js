/* jshint -W089 */
/* jshint -W069 */

export default function() {
  this.serialize = function (ast) {
    let string = '';
    for (const id in ast) {
      string += dumpEntry(ast[id]) + '\n';
    }

    return string;
  };

  function dumpEntry(entry) {
    return dumpEntity(entry);
  }

  function dumpEntity(entity) {
    let id, val = null;
    const attrs = {};
    let index = '';

    for (const key in entity) {
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
    let str = '"';
    for (let i = 0; i < chunks.length; i++) {
      if (typeof chunks[i] === 'string') {
        str += chunks[i];
      } else {
        str += '{{ ' + chunks[i].v.replace(/-/g, '_') + ' }}';
      }
    }
    return str + '"';
  }

  function dumpHash(hash, depth) {
    const items = [];
    let str;

    for (const key in hash) {
      str = '  ' + key + ': ' + dumpValue(hash[key]);
      items.push(str);
    }

    const indent = depth ? '  ' : '';
    return '{\n' + indent + items.join(',\n' + indent) + '\n'+indent+'}';
  }

  function dumpAttributes(attrs) {
    let str = '';
    for (const key in attrs) {
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
