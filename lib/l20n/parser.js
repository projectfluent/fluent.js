'use strict';

var EventEmitter = require('./events').EventEmitter;

var nestedProps = ['style', 'dataset'];

function Parser() {

  /* Public */

  this.parse = parse;

  this._emitter = new EventEmitter();

  var patterns = {
    comment: /^\s*#|^\s*$/,
    entity: /^([^=\s]+)\s*=\s*(.+)$/,
    multiline: /[^\\]\\$/,
    macro: /\{\[\s*(\w+)\(([^\)]*)\)\s*\]\}/i,
    unicode: /\\u([0-9a-fA-F]{1,4})/g,
    entries: /[\r\n]+/
  };

  function parse(source) {
    var ast = {};

    var entries = source.split(patterns['entries']);
    for (var i = 0; i < entries.length; i++) {
      var line = entries[i];

      if (patterns['comment'].test(line)) {
        continue;
      }

      while (patterns['multiline'].test(line) && i < entries.length) {
        line = line.slice(0, line.length - 1) + entries[++i].trim();
      }

      var entityMatch = line.match(patterns['entity']);
      if (entityMatch && entityMatch.length == 3) {
        try {
          parseEntity(entityMatch, ast);
        } catch (e) {
          _emitter.emit('error', e);
        }
      }
    }
    return ast;
  }

  function setEntityValue(id, attr, key, value, ast) {
    var obj = ast;
    var prop = id;
    if (attr) {
      if (!(id in obj)) {
        obj[id] = {};
      }
      if (typeof(obj[id]) === 'string') {
        obj[id] = {'_': obj[id]};
      }
      obj = obj[id];
      prop = attr;
    }
    if (!key) {
      obj[prop] = value;
      return;
    } else {
      if (!(prop in obj)) {
        obj[prop] = {'_': {}};
        obj[prop]._[key] = value;
      } else {
        if (typeof(obj[prop]) === 'string') {
          obj[prop] = {'_index': parseMacro(obj[prop]), '_': {}};
          obj[prop]._[key] = value;
        } else {
          obj[prop]._[key] = value;
        }
      }
    }
    return;
  }

  function parseEntity(match, ast) {
    var name, key, attr, pos;
    var value = match[2];

    pos = match[1].indexOf('[');
    if (pos !== -1) {
      name = match[1].substr(0, pos);
      key = match[1].substring(pos + 1, match[1].length - 1);
    } else {
      name = match[1];
      key = null;
    }

    var nameElements = name.split('.');

    if (nameElements.length > 1) {
      var attrElements = [];
      attrElements.push(nameElements.pop());
      if (nameElements.length > 1) {
        // special quirk to comply with webl10n's behavior
        if (nestedProps.indexOf(
              nameElements[nameElements.length - 1]) !== -1) {
                attrElements.push(nameElements.pop());
              }
      }
      name = nameElements.join('.');
      attr = attrElements.reverse().join('.');
    } else {
      attr = null;
    }

    setEntityValue(name, attr, key, unescapeString(value), ast);
  }

  function unescapeControlCharacters(str) {
    return str.replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\b/g, '\b')
      .replace(/\\f/g, '\f')
      .replace(/\\{/g, '{')
      .replace(/\\}/g, '}')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
  }

  function unescapeUnicode(str) {
    return str.replace(patterns.unicode, function(match, token) {
      return unescape('%u' + '0000'.slice(token.length) + token);
    });
  }

  function unescapeString(str) {
    if (str.lastIndexOf('\\') !== -1) {
      str = unescapeControlCharacters(str);
    }
    return unescapeUnicode(str);
  }

  function parseMacro(str) {
    var match = str.match(patterns.macro);
    if (!match) {
      return [];
    }
    return [match[1], match[2]];
  }
}
