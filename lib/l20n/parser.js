'use strict';

var unescape = require('querystring').unescape;

var nestedProps = ['style', 'dataset'];

var parsePatterns;

function parse(ctx, source) {
  var ast = {};

  if (!parsePatterns) {
    parsePatterns = {
      comment: /^\s*#|^\s*$/,
      entity: /^([^=\s]+)\s*=\s*(.+)$/,
      multiline: /[^\\]\\$/,
      macro: /\{\[\s*(\w+)\(([^\)]*)\)\s*\]\}/i,
      unicode: /\\u([0-9a-fA-F]{1,4})/g,
      entries: /[\r\n]+/,
      controlChars: /\\([\\\n\r\t\b\f\{\}\"\'])/g
    };
  }

  var entries = source.split(parsePatterns.entries);
  for (var i = 0; i < entries.length; i++) {
    var line = entries[i];

    if (parsePatterns.comment.test(line)) {
      continue;
    }

    while (parsePatterns.multiline.test(line) && i < entries.length) {
      line = line.slice(0, -1) + entries[++i].trim();
    }

    var entityMatch = line.match(parsePatterns.entity);
    if (entityMatch) {
      try {
        parseEntity(entityMatch[1], entityMatch[2], ast);
      } catch (e) {
        if (ctx) {
          ctx._emitter.emit('error', e);
        } else {
          throw e;
        }
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
  }

  if (!(prop in obj)) {
    obj[prop] = {'_': {}};
  } else if (typeof(obj[prop]) === 'string') {
    obj[prop] = {'_index': parseMacro(obj[prop]), '_': {}};
  }
  obj[prop]._[key] = value;
}

function parseEntity(id, value, ast) {
  var name, key, pos;

  pos = id.indexOf('[');
  if (pos !== -1) {
    name = id.substr(0, pos);
    key = id.substring(pos + 1, id.length - 1);
  } else {
    name = id;
    key = null;
  }

  var nameElements = name.split('.');

  var attr;
  if (nameElements.length > 1) {
    var attrElements = [];
    attrElements.push(nameElements.pop());
    if (nameElements.length > 1) {
      // Usually the last dot separates an attribute from an id
      //
      // In case when there are more than one dot in the id
      // and the second to last item is "style" or "dataset" then the last two
      // items are becoming the attribute.
      //
      // ex.
      // id.style.color = foo =>
      //
      // id:
      //   style.color: foo
      //
      // id.other.color = foo =>
      //
      // id.other:
      //   color: foo
      if (nestedProps.indexOf(nameElements[nameElements.length - 1]) !== -1) {
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
  return str.replace(parsePatterns.controlChars, '$1');
}

function unescapeUnicode(str) {
  return str.replace(parsePatterns.unicode, function(match, token) {
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
  var match = str.match(parsePatterns.macro);
  if (!match) {
    throw new Error('Malformed macro');
  }
  return [match[1], match[2]];
}

exports.parse = parse;
