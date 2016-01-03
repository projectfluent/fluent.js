/*eslint no-magic-numbers: [0]*/

import { L10nError } from '../../../errors';

const MAX_PLACEABLES = 100;

export default {
  parse: function(emit, string) {
    this._source = string;
    this._index = 0;
    this._length = string.length;
    this.entries = Object.create(null);
    this.emit = emit;

    return this.getResource();
  },

  getResource: function() {
    this.getWS();
    while (this._index < this._length) {
      try {
        this.getEntry();
      } catch (e) {
        if (e instanceof L10nError) {
          // we want to recover, but we don't need it in entries
          this.getJunkEntry();
          if (!this.emit) {
            throw e;
          }
        } else {
          throw e;
        }
      }

      if (this._index < this._length) {
        this.getWS();
      }
    }

    return this.entries;
  },

  getEntry: function() {
    if (this._source[this._index] === '<') {
      ++this._index;
      const id = this.getIdentifier();
      if (this._source[this._index] === '[') {
        ++this._index;
        return this.getEntity(id, this.getItemList(this.getExpression, ']'));
      }
      return this.getEntity(id);
    }

    if (this._source.startsWith('/*', this._index)) {
      return this.getComment();
    }

    throw this.error('Invalid entry');
  },

  getEntity: function(id, index) {
    if (!this.getRequiredWS()) {
      throw this.error('Expected white space');
    }

    const ch = this._source[this._index];
    const hasIndex = index !== undefined;
    const value = this.getValue(ch, hasIndex, hasIndex);
    let attrs;

    if (value === undefined) {
      if (ch === '>') {
        throw this.error('Expected ">"');
      }
      attrs = this.getAttributes();
    } else {
      const ws1 = this.getRequiredWS();
      if (this._source[this._index] !== '>') {
        if (!ws1) {
          throw this.error('Expected ">"');
        }
        attrs = this.getAttributes();
      }
    }

    // skip '>'
    ++this._index;

    if (id in this.entries) {
      throw this.error('Duplicate entry ID "' + id, 'duplicateerror');
    }
    if (!attrs && !index && typeof value === 'string') {
      this.entries[id] = value;
    } else {
      this.entries[id] = {
        value,
        attrs,
        index
      };
    }
  },

  getValue: function(
    ch = this._source[this._index], index = false, required = true) {
    switch (ch) {
      case '\'':
      case '"':
        return this.getString(ch, 1);
      case '{':
        return this.getHash(index);
    }

    if (required) {
      throw this.error('Unknown value type');
    }

    return undefined;
  },

  getWS: function() {
    let cc = this._source.charCodeAt(this._index);
    // space, \n, \t, \r
    while (cc === 32 || cc === 10 || cc === 9 || cc === 13) {
      cc = this._source.charCodeAt(++this._index);
    }
  },

  getRequiredWS: function() {
    const pos = this._index;
    let cc = this._source.charCodeAt(pos);
    // space, \n, \t, \r
    while (cc === 32 || cc === 10 || cc === 9 || cc === 13) {
      cc = this._source.charCodeAt(++this._index);
    }
    return this._index !== pos;
  },

  getIdentifier: function() {
    const start = this._index;
    let cc = this._source.charCodeAt(this._index);

    if ((cc >= 97 && cc <= 122) || // a-z
        (cc >= 65 && cc <= 90) ||  // A-Z
        cc === 95) {               // _
      cc = this._source.charCodeAt(++this._index);
    } else {
      throw this.error('Identifier has to start with [a-zA-Z_]');
    }

    while ((cc >= 97 && cc <= 122) || // a-z
           (cc >= 65 && cc <= 90) ||  // A-Z
           (cc >= 48 && cc <= 57) ||  // 0-9
           cc === 95) {               // _
      cc = this._source.charCodeAt(++this._index);
    }

    return this._source.slice(start, this._index);
  },

  getUnicodeChar: function() {
    for (let i = 0; i < 4; i++) {
      const cc = this._source.charCodeAt(++this._index);
      if ((cc > 96 && cc < 103) || // a-f
          (cc > 64 && cc < 71) ||  // A-F
          (cc > 47 && cc < 58)) {  // 0-9
        continue;
      }
      throw this.error('Illegal unicode escape sequence');
    }
    this._index++;
    return String.fromCharCode(
      parseInt(this._source.slice(this._index - 4, this._index), 16));
  },

  stringRe: /"|'|{{|\\/g,
  getString: function(opchar, opcharLen) {
    const body = [];
    let placeables = 0;

    this._index += opcharLen;
    const start = this._index;

    let bufStart = start;
    let buf = '';

    while (true) {
      this.stringRe.lastIndex = this._index;
      const match = this.stringRe.exec(this._source);

      if (!match) {
        throw this.error('Unclosed string literal');
      }

      if (match[0] === '"' || match[0] === '\'') {
        if (match[0] !== opchar) {
          this._index += opcharLen;
          continue;
        }
        this._index = match.index + opcharLen;
        break;
      }

      if (match[0] === '{{') {
        if (placeables > MAX_PLACEABLES - 1) {
          throw this.error('Too many placeables, maximum allowed is ' +
              MAX_PLACEABLES);
        }
        placeables++;
        if (match.index > bufStart || buf.length > 0) {
          body.push(buf + this._source.slice(bufStart, match.index));
          buf = '';
        }
        this._index = match.index + 2;
        this.getWS();
        body.push(this.getExpression());
        this.getWS();
        this._index += 2;
        bufStart = this._index;
        continue;
      }

      if (match[0] === '\\') {
        this._index = match.index + 1;
        const ch2 = this._source[this._index];
        if (ch2 === 'u') {
          buf += this._source.slice(bufStart, match.index) +
            this.getUnicodeChar();
        } else if (ch2 === opchar || ch2 === '\\') {
          buf += this._source.slice(bufStart, match.index) + ch2;
          this._index++;
        } else if (this._source.startsWith('{{', this._index)) {
          buf += this._source.slice(bufStart, match.index) + '{{';
          this._index += 2;
        } else {
          throw this.error('Illegal escape sequence');
        }
        bufStart = this._index;
      }
    }

    if (body.length === 0) {
      return buf + this._source.slice(bufStart, this._index - opcharLen);
    }

    if (this._index - opcharLen > bufStart || buf.length > 0) {
      body.push(buf + this._source.slice(bufStart, this._index - opcharLen));
    }

    return body;
  },

  getAttributes: function() {
    const attrs = Object.create(null);

    while (true) {
      this.getAttribute(attrs);
      const ws1 = this.getRequiredWS();
      const ch = this._source.charAt(this._index);
      if (ch === '>') {
        break;
      } else if (!ws1) {
        throw this.error('Expected ">"');
      }
    }
    return attrs;
  },

  getAttribute: function(attrs) {
    const key = this.getIdentifier();
    let index;

    if (this._source[this._index]=== '[') {
      ++this._index;
      this.getWS();
      index = this.getItemList(this.getExpression, ']');
    }
    this.getWS();
    if (this._source[this._index] !== ':') {
      throw this.error('Expected ":"');
    }
    ++this._index;
    this.getWS();
    const hasIndex = index !== undefined;
    const value = this.getValue(undefined, hasIndex);

    if (key in attrs) {
      throw this.error('Duplicate attribute "' + key, 'duplicateerror');
    }

    if (!index && typeof value === 'string') {
      attrs[key] = value;
    } else {
      attrs[key] = {
        value,
        index
      };
    }
  },

  getHash: function(index) {
    const items = Object.create(null);

    ++this._index;
    this.getWS();

    let defKey;

    while (true) {
      const [key, value, def] = this.getHashItem();
      items[key] = value;

      if (def) {
        if (defKey) {
          throw this.error('Default item redefinition forbidden');
        }
        defKey = key;
      }
      this.getWS();

      const comma = this._source[this._index] === ',';
      if (comma) {
        ++this._index;
        this.getWS();
      }
      if (this._source[this._index] === '}') {
        ++this._index;
        break;
      }
      if (!comma) {
        throw this.error('Expected "}"');
      }
    }

    if (defKey) {
      items.__default = defKey;
    } else if (!index) {
      throw this.error('Unresolvable Hash Value');
    }

    return items;
  },

  getHashItem: function() {
    let defItem = false;
    if (this._source[this._index] === '*') {
      ++this._index;
      defItem = true;
    }

    const key = this.getIdentifier();
    this.getWS();
    if (this._source[this._index] !== ':') {
      throw this.error('Expected ":"');
    }
    ++this._index;
    this.getWS();

    return [key, this.getValue(), defItem];
  },

  getComment: function() {
    this._index += 2;
    const start = this._index;
    const end = this._source.indexOf('*/', start);

    if (end === -1) {
      throw this.error('Comment without a closing tag');
    }

    this._index = end + 2;
  },

  getExpression: function () {
    let exp = this.getPrimaryExpression();

    while (true) {
      const ch = this._source[this._index];
      if (ch === '.' || ch === '[') {
        ++this._index;
        exp = this.getPropertyExpression(exp, ch === '[');
      } else if (ch === '(') {
        ++this._index;
        exp = this.getCallExpression(exp);
      } else {
        break;
      }
    }

    return exp;
  },

  getPropertyExpression: function(idref, computed) {
    let exp;

    if (computed) {
      this.getWS();
      exp = this.getExpression();
      this.getWS();
      if (this._source[this._index] !== ']') {
        throw this.error('Expected "]"');
      }
      ++this._index;
    } else {
      exp = this.getIdentifier();
    }

    return {
      type: 'prop',
      expr: idref,
      prop: exp,
      cmpt: computed
    };
  },

  getCallExpression: function(callee) {
    this.getWS();

    return {
      type: 'call',
      expr: callee,
      args: this.getItemList(this.getExpression, ')')
    };
  },

  getPrimaryExpression: function() {
    const ch = this._source[this._index];

    switch (ch) {
      case '$':
        ++this._index;
        return {
          type: 'var',
          name: this.getIdentifier()
        };
      case '@':
        ++this._index;
        return {
          type: 'glob',
          name: this.getIdentifier()
        };
      default:
        return {
          type: 'id',
          name: this.getIdentifier()
        };
    }
  },

  getItemList: function(callback, closeChar) {
    const items = [];
    let closed = false;

    this.getWS();

    if (this._source[this._index] === closeChar) {
      ++this._index;
      closed = true;
    }

    while (!closed) {
      items.push(callback.call(this));
      this.getWS();
      const ch = this._source.charAt(this._index);
      switch (ch) {
        case ',':
          ++this._index;
          this.getWS();
          break;
        case closeChar:
          ++this._index;
          closed = true;
          break;
        default:
          throw this.error('Expected "," or "' + closeChar + '"');
      }
    }

    return items;
  },


  getJunkEntry: function() {
    const pos = this._index;
    let nextEntity = this._source.indexOf('<', pos);
    let nextComment = this._source.indexOf('/*', pos);

    if (nextEntity === -1) {
      nextEntity = this._length;
    }
    if (nextComment === -1) {
      nextComment = this._length;
    }

    const nextEntry = Math.min(nextEntity, nextComment);

    this._index = nextEntry;
  },

  error: function(message, type = 'parsererror') {
    const pos = this._index;

    let start = this._source.lastIndexOf('<', pos - 1);
    const lastClose = this._source.lastIndexOf('>', pos - 1);
    start = lastClose > start ? lastClose + 1 : start;
    const context = this._source.slice(start, pos + 10);

    const msg = message + ' at pos ' + pos + ': `' + context + '`';
    const err = new L10nError(msg);
    if (this.emit) {
      this.emit(type, err);
    }
    return err;
  },
};
