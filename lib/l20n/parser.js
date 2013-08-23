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
    };

    function parse(source) {
      var ast = [];

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
          var val = {
            type: 'Entity',
            id: {
              type: 'Identifier',
              name: entity_match[1]
            },
            value: {
              type: 'String',
              content: entity_match[2]
            }
          };
          ast.push(val);
        }
      }
      return {
        type: 'WebL10n',
        body: ast
      }
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
