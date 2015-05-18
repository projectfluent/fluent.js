'use strict';

var L10nError = require('../../errors').L10nError;

var MAX_PLACEABLES_L20N = 100;

var L20nParser = {
  _patterns: {
    identifier: /[A-Za-z_]\w*/g,
    unicode: /\\u([0-9a-fA-F]{1,4})/g,
    index: /@cldr\.plural\(\$?(\w+)\)/g,
    placeables: /\{\{\s*\$?([^\s]*?)\s*\}\}/,
    unesc: /\\({{|u[0-9a-fA-F]{4}|.)/g,
  },

  parse: function (ctx, string, simple) {
    this._source = string;
    this._index = 0;
    this._length = this._source.length;
    this.simpleMode = simple;
    this.ctx = ctx;

    return this.getL20n();
  },

  getAttributes: function() {
    var attrs = Object.create(null);
    var attr, ws1, ch;

    while (true) {
      attr = this.getKVPWithIndex();
      attrs[attr[0]] = attr[1];
      ws1 = this.getRequiredWS();
      ch = this._source.charAt(this._index);
      if (ch === '>') {
        break;
      } else if (!ws1) {
        throw this.error('Expected ">"');
      }
    }
    return attrs;
  },

  getKVP: function() {
    var key = this.getIdentifier();
    this.getWS();
    if (this._source.charAt(this._index) !== ':') {
      throw this.error('Expected ":"');
    }
    ++this._index;
    this.getWS();
    return [key, this.getValue()];
  },

  getKVPWithIndex: function() {
    var key = this.getIdentifier();
    var index = null;

    if (this._source.charAt(this._index) === '[') {
      ++this._index;
      this.getWS();
      index = this.getIndex();
    }
    this.getWS();
    if (this._source.charAt(this._index) !== ':') {
      throw this.error('Expected ":"');
    }
    ++this._index;
    this.getWS();
    return [
      key,
      this.getValue(false, undefined, index)
    ];
  },

  getHash: function() {
    ++this._index;
    this.getWS();
    var hi, comma, hash = {};
    while (true) {
      hi = this.getKVP();
      hash[hi[0]] = hi[1];
      this.getWS();

      comma = this._source.charAt(this._index) === ',';
      if (comma) {
        ++this._index;
        this.getWS();
      }
      if (this._source.charAt(this._index) === '}') {
        ++this._index;
        break;
      }
      if (!comma) {
        throw this.error('Expected "}"');
      }
    }
    return hash;
  },

  unescapeString: function(str, opchar) {
    function replace(match, p1) {
      switch (p1) {
        case '\\':
          return '\\';
        case '{{':
          return '{{';
        case opchar:
          return opchar;
        default:
          if (p1.length === 5 && p1.charAt(0) === 'u') {
            return String.fromCharCode(parseInt(p1.substr(1), 16));
          }
          throw this.error('Illegal unescape sequence');
      }
    }
    return str.replace(this._patterns.unesc, replace.bind(this));
  },

  getString: function(opchar) {
    var overlay = false;

    var opcharPos = this._source.indexOf(opchar, this._index + 1);

    outer:
    while (opcharPos !== -1) {
      var backtrack = opcharPos - 1;
      // 92 === '\'
      while (this._source.charCodeAt(backtrack) === 92) {
        if (this._source.charCodeAt(backtrack - 1) === 92) {
          backtrack -= 2;
        } else {
          opcharPos = this._source.indexOf(opchar, opcharPos + 1);
          continue outer;
        }
      }
      break;
    }

    if (opcharPos === -1) {
      throw this.error('Unclosed string literal');
    }

    var buf = this._source.slice(this._index + 1, opcharPos);

    this._index = opcharPos + 1;

    if (!this.simpleMode && buf.indexOf('\\') !== -1) {
      buf = this.unescapeString(buf, opchar);
    }

    if (buf.indexOf('<') > -1 || buf.indexOf('&') > -1) {
      overlay = true;
    }

    if (!this.simpleMode && buf.indexOf('{{') !== -1) {
      return [this.parseString(buf), overlay];
    }

    return [buf, overlay];
  },

  getValue: function(optional, ch, index) {
    var val;

    if (ch === undefined) {
      ch = this._source.charAt(this._index);
    }
    if (ch === '\'' || ch === '"') {
      var valAndOverlay = this.getString(ch);
      if (valAndOverlay[1]) {
        val = {'$o': valAndOverlay[0]};
      } else {
        val = valAndOverlay[0];
      }
    } else if (ch === '{') {
      val = this.getHash();
    }

    if (val === undefined) {
      if (!optional) {
        throw this.error('Unknown value type');
      }
      return null;
    }

    if (index) {
      return {'$v': val, '$x': index};
    }

    return val;
  },

  getRequiredWS: function() {
    var pos = this._index;
    var cc = this._source.charCodeAt(pos);
    // space, \n, \t, \r
    while (cc === 32 || cc === 10 || cc === 9 || cc === 13) {
      cc = this._source.charCodeAt(++this._index);
    }
    return this._index !== pos;
  },

  getWS: function() {
    var cc = this._source.charCodeAt(this._index);
    // space, \n, \t, \r
    while (cc === 32 || cc === 10 || cc === 9 || cc === 13) {
      cc = this._source.charCodeAt(++this._index);
    }
  },


  getIdentifier: function() {
    var reId = this._patterns.identifier;
    reId.lastIndex = this._index;
    var match = reId.exec(this._source);
    if (reId.lastIndex !== this._index + match[0].length) {
      throw this.error('Identifier has to start with [a-zA-Z_]');
    }
    this._index = reId.lastIndex;

    return match[0];
  },

  getComment: function() {
    this._index += 2;
    var start = this._index;
    var end = this._source.indexOf('*/', start);

    if (end === -1) {
      throw this.error('Comment without closing tag');
    }
    this._index = end + 2;
    return;
  },

  getEntity: function(id, index) {
    var entity = {'$i': id};

    if (index) {
      entity.$x = index;
    }

    if (!this.getRequiredWS()) {
      throw this.error('Expected white space');
    }

    var ch = this._source.charAt(this._index);
    var value = this.getValue(index === null, ch);
    var attrs = null;
    if (value === null) {
      if (ch === '>') {
        throw this.error('Expected ">"');
      }
      attrs = this.getAttributes();
    } else {
      entity.$v = value;
      var ws1 = this.getRequiredWS();
      if (this._source.charAt(this._index) !== '>') {
        if (!ws1) {
          throw this.error('Expected ">"');
        }
        attrs = this.getAttributes();
      }
    }

    // skip '>'
    ++this._index;

    if (attrs) {
      /* jshint -W089 */
      for (var key in attrs) {
        entity[key] = attrs[key];
      }
    }

    return entity;
  },

  getEntry: function() {
    // 60 === '<'
    if (this._source.charCodeAt(this._index) === 60) {
      ++this._index;
      var id = this.getIdentifier();
      // 91 == '['
      if (this._source.charCodeAt(this._index) === 91) {
        ++this._index;
        return this.getEntity(id,
                         this.getIndex());
      }
      return this.getEntity(id, null);
    }
    if (this._source.charCodeAt(this._index) === 47 &&
        this._source.charCodeAt(this._index + 1) === 42) {
      return this.getComment();
    }
    throw this.error('Invalid entry');
  },

  getL20n: function() {
    var ast = [];

    this.getWS();
    while (this._index < this._length) {
      try {
        var entry = this.getEntry();
        if (entry) {
          ast.push(entry);
        }
      } catch (e) {
        if (this.ctx) {
          this.ctx._emitter.emit('parsererror', e);
        } else {
          throw e;
        }
      }

      if (this._index < this._length) {
        this.getWS();
      }
    }

    return ast;
  },

  getIndex: function() {
    this.getWS();
    this._patterns.index.lastIndex = this._index;
    var match = this._patterns.index.exec(this._source);
    this._index = this._patterns.index.lastIndex;
    this.getWS();
    this._index++;

    return [{t: 'idOrVar', v: 'plural'}, match[1]];
  },

  parseString: function(str) {
    var chunks = str.split(this._patterns.placeables);
    var complexStr = [];

    var len = chunks.length;
    var placeablesCount = (len - 1) / 2;

    if (placeablesCount >= MAX_PLACEABLES_L20N) {
      throw new L10nError('Too many placeables (' + placeablesCount +
                          ', max allowed is ' + MAX_PLACEABLES_L20N + ')');
    }

    for (var i = 0; i < chunks.length; i++) {
      if (chunks[i].length === 0) {
        continue;
      }
      if (i % 2 === 1) {
        complexStr.push({t: 'idOrVar', v: chunks[i]});
      } else {
        complexStr.push(chunks[i]);
      }
    }
    return complexStr;
  },

  error: function(message, pos) {
    if (pos === undefined) {
      pos = this._index;
    }
    var start = this._source.lastIndexOf('<', pos - 1);
    var lastClose = this._source.lastIndexOf('>', pos - 1);
    start = lastClose > start ? lastClose + 1 : start;
    var context = this._source.slice(start, pos + 10);

    var msg = message + ' at pos ' + pos + ': "' + context + '"';
    return new L10nError(msg, pos, context);
  }
};

module.exports = L20nParser;
