if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports, module) {
  'use strict';

  var EventEmitter = require('./events').EventEmitter;

  function Parser() {

    /* Public */

    this.parse = parse;
    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;

    var _emitter = new EventEmitter();

    var patterns = {
      comment: /^\s*#|^\s*$/,
      entity: /^([^=\s]*)\s*=\s*(.+)$/,
      multiline: /[^\\]\\$/,
      plural: /\{\[\s*plural\(([^\)]+)\)\s*\]\}/,
      unicode: /\\u([0-9a-fA-F]{1,4})/g
    };

    function parse(source) {
      var ast = {};

      var entries = source.split(/[\r\n]+/);
      for (var i = 0; i < entries.length; i++) {
        var line = entries[i];

        if (patterns['comment'].test(line)) {
          continue;
        }

        while (patterns['multiline'].test(line) && i < entries.length) {
          line = line.slice(0, line.length - 1) + entries[++i];
        }

        var entity_match = line.match(patterns['entity']);
        if (entity_match && entity_match.length == 3) {

          parseEntity(entity_match, ast);
        }
      }
      return {
        type: 'WebL10n',
        body: ast
      };
    }

    function addEntityValue(id, key, value, ast) {
      var entry = ast[id];
      if (entry.value.type !== 'Hash') {
        var match = entry.value.content.match(patterns['plural']);
        entry.index = [
          {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: 'plural'
            },
            arguments: [{
              type: 'Identifier',
              name: match[1]
            }]
          } 
        ];
        entry.value = {
          type: 'Hash',
          content: []
        };
      }
      entry.value.content.push({
        type: 'HashItem',
        key: key,
        value: value
      });
    }

    function addEntityAttribute(id, key, value, ast) {
      var entry = ast[id];
      if (!entry) {
        entry = {
          type: 'Entity',
          id: {
            type: 'Identifier',
            name: id
          },
          attrs: {},
          value: null
        };
        ast[id] = entry;
      }
      entry.attrs[key] = {
        type: 'Attribute',
        value: value
      };
    }

    function parseEntity(match, ast) {
      var pos = match[1].indexOf('[');
      var value = parseString(match[2]);

      if (pos !== -1) {
        var name = match[1].substr(0, pos);
        var key = match[1].substring(pos + 1, match[1].length - 1);
        addEntityValue(name, key, value, ast);
        return;
      } else {
        pos = match[1].indexOf('.');
        if (pos !== -1) {
          var idParts = match[1].split('.');
          addEntityAttribute(idParts[0], idParts[1], value, ast);
          return;
        }
      }
      ast[match[1]] = {
        type: 'Entity',
        attrs: {},
        value: value
      };
    }

    function unescapeUnicode(str) {
      return str.replace(patterns.unicode, function(match, token) {
        return unescape('%u' + '0000'.slice(token.length) + token);
      });
    }

    function parseString(str) {
      if (str.indexOf('{{') === -1) {
        return {
          type: 'String',
          content: unescapeUnicode(str)
        };
      }

      var chunks = str.split('{{');
      var body = [];

      chunks.forEach(function (chunk, num) {
        if (num === 0) {
          if (chunk.length > 0) {
            body.push({
              type: 'String',
              content: unescapeUnicode(chunk)
            });
          }
          return;
        }
        var parts = chunk.split('}}');
        body.push({
          type: 'Identifier',
          name: parts[0]
        });
        if (parts[1].length > 0) {
          body.push({
            type: 'String',
            content: unescapeUnicode(parts[1])
          });
        }
      });
      return {
        type: 'ComplexString',
        body: body
      };
    }

    function addEventListener(type, listener) {
      if (!_emitter) {
        throw Error('Emitter not available');
      }
      return _emitter.addEventListener(type, listener);
    }

    function removeEventListener(type, listener) {
      if (!_emitter) {
        throw Error('Emitter not available');
      }
      return _emitter.removeEventListener(type, listener);
    }
  }

  /* ParserError class */

  Parser.Error = ParserError;

  function ParserError(message, pos, context) {
    this.name = 'ParserError';
    this.message = message;
    this.pos = pos;
    this.context = context;
  }
  ParserError.prototype = Object.create(Error.prototype);
  ParserError.prototype.constructor = ParserError;

  exports.Parser = Parser;

});
