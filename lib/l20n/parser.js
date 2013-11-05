if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports, module) {
  'use strict';

  var EventEmitter = require('./events').EventEmitter;

  var nestedProps = ['style', 'dataset'];

  function Parser() {

    /* Public */

    this.parse = parse;
    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;


    var MAX_PLACEABLES = 100;

    var _emitter = new EventEmitter();

    var patterns = {
      comment: /^\s*#|^\s*$/,
      entity: /^([^=\s]+)\s*=\s*(.+)$/,
      multiline: /[^\\]\\$/,
      plural: /\{\[\s*plural\(([^\)]+)\)\s*\]\}/,
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
            if (e instanceof ParserError) {
              _emitter.emit('error', e);
              continue;
            }
          }
        }
      }
      return {
        type: 'WebL10n',
        body: ast
      };
    }

    function setEntityValue(id, attr, key, value, ast) {
      var entry = ast[id];
      var item;

      if (!entry) {
        entry = {};
        ast[id] = entry;
      }

      if (attr) {
        if (!('attrs' in entry)) {
          entry.attrs = {};
        }
        if (!(attr in entry.attrs)) {
          entry.attrs[attr] = {};
        }
        item = entry.attrs[attr];
      } else {
        item = entry;
      }

      if (!key) {
        item.value = value;
      } else {
        if (item.value.type !== 'Hash') {
          var match = item.value.content.match(patterns['plural']);
          if (!match) {
            throw new ParserError('Expected macro call');
          }
          item.index = [
          {
            type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: 'plural'
              },
              arguments: [{
                type: 'Identifier',
                name: match[1].trim()
              }]
          }
          ];
          item.value = {
            type: 'Hash',
            content: []
          };
        }
        item.value.content.push({
          type: 'HashItem',
          key: key,
          value: value
        });
        if (key === 'other') {
          item.value.content[item.value.content.length - 1].default = true;
        }
      }
    }

    function parseEntity(match, ast) {
      var name, key, attr, pos;
      var value = parseValue(match[2]);

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
        } else if (attrElements[0] === 'ariaLabel') {
          // special quirk to comply with webl10n's behavior
          attrElements[0] = 'aria-label';
        }
        name = nameElements.join('.');
        attr = attrElements.reverse().join('.');
      } else {
        attr = null;
      }

      setEntityValue(name, attr, key, value, ast);
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

    function parseValue(str) {

      var placeables = 0;

      if (str.indexOf('{{') === -1) {
        return {
          content: unescapeString(str)
        };
      }
      var chunks = str.split('{{');
      var body = [];

      chunks.forEach(function (chunk, num) {
        if (num === 0) {
          if (chunk.length > 0) {
            body.push({
              content: unescapeString(chunk)
            });
          }
          return;
        }
        var parts = chunk.split('}}');
        if (parts.length < 2) {
          throw new ParserError('Expected "}}"');
        }
        body.push({
          type: 'Identifier',
          name: parts[0].trim()
        });
        placeables++;
        if (placeables > MAX_PLACEABLES) {
          throw new ParserError('Too many placeables, maximum allowed is ' +
            MAX_PLACEABLES);
        }
        if (parts[1].length > 0) {
          body.push({
            content: unescapeString(parts[1])
          });
        }
      });
      return {
        type: 'ComplexString',
        content: body,
        source: str
      };
    }

    function addEventListener(type, listener) {
      return _emitter.addEventListener(type, listener);
    }

    function removeEventListener(type, listener) {
      return _emitter.removeEventListener(type, listener);
    }
  }

  /* ParserError class */

  Parser.Error = ParserError;

  function ParserError(message) {
    this.name = 'ParserError';
    this.message = message;
  }
  ParserError.prototype = Object.create(Error.prototype);
  ParserError.prototype.constructor = ParserError;

  exports.Parser = Parser;

});
