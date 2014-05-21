'use strict';

var L10nError = require('./errors').L10nError;

var unescape = require('querystring').unescape;

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
  var name, key;

  var pos = id.indexOf('[');
  if (pos !== -1) {
    name = id.substr(0, pos);
    key = id.substring(pos + 1, id.length - 1);
  } else {
    name = id;
    key = null;
  }

  var nameElements = name.split('.');

  if (nameElements.length > 2) {
    throw new Error('Error in ID: "' + name + '".' +
                    ' Nested attributes are not supported.');
  }

  var attr;
  if (nameElements.length > 1) {
    name = nameElements[0];
    attr = nameElements[1];
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
    throw new L10nError('Malformed macro');
  }
  return [match[1], match[2]];
}

exports.parse = parse;
