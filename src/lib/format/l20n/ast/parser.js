'use strict';

import AST from './ast';
import { L10nError } from '../../../errors';

const MAX_PLACEABLES = 100;

export default {
  parse: function(env, string, pos = false) {
    this._source = string;
    this._index = 0;
    this._length = string.length;
    this._curEntryStart = 0;
    this._config = {
      pos: pos
    };

    if (pos !== true) {
      AST.Node.prototype.setPosition = function() {};
    }
    return this.getResource(pos);
  },

  getResource: function() {
    let resource = new AST.Resource();
    resource.setPosition(0, this._length);
    resource._errors = [];

    this.getWS();
    while (this._index < this._length) {
      try {
        resource.body.push(this.getEntry());
      } catch (e) {
        if (e instanceof L10nError) {
          resource._errors.push(e);
          resource.body.push(this.getJunkEntry());
        } else {
          throw e;
        }
      }
      if (this._index < this._length) {
        this.getWS();
      }
    }

    return resource;
  },

  getEntry: function() {
    this._curEntryStart = this._index;

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

    const ch = this._source.charAt(this._index);
    const value = this.getValue(ch, index === undefined);
    let attrs;

    if (value === null) {
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

    const entity = new AST.Entity(id, value, index, attrs);
    entity.setPosition(this._curEntryStart, this._index);
    return entity;
  },

  getValue: function(ch = this._source[this._index], optional = false) {
    switch (ch) {
      case '\'':
      case '"':
        return this.getString(ch, 1);
      case '{':
        return this.getHash();
    }

    if (!optional) {
      throw this.error('Unknown value type');
    }
    return null;
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

    const id = new AST.Identifier(this._source.slice(start, this._index));
    id.setPosition(start, this._index);
    return id;
  },

  getUnicodeChar: function() {
    for (let i = 0; i < 4; i++) {
      let cc = this._source.charCodeAt(++this._index);
      if ((cc > 96 && cc < 103) || // a-f
          (cc > 64 && cc < 71) ||  // A-F
          (cc > 47 && cc < 58)) {  // 0-9
        continue;
      }
      throw this.error('Illegal unicode escape sequence');
    }
    return '\\u' + this._source.slice(this._index - 3, this._index + 1);
  },

  getString: function(opchar, opcharLen) {
    let body = [];
    let buf = '';
    let placeables = 0;

    this._index += opcharLen - 1;

    const start = this._index + 1;

    let closed = false;

    while (!closed) {
      let ch = this._source[++this._index];
      
      switch (ch) {
        case '\\':
          const ch2 = this._source[++this._index];
          if (ch2 === 'u') {
            buf += this.getUnicodeChar();
          } else if (ch2 === opchar || ch2 === '\\') {
            buf += ch2;
          } else if (ch2 === '{' && this._source[this._index + 1] === '{') {
            buf += '{';
          } else {
            throw this.error('Illegal escape sequence');
          }
          break;
        case '{':
          if (this._source[this._index + 1] === '{') {
            if (placeables > MAX_PLACEABLES - 1) {
              throw this.error('Too many placeables, maximum allowed is ' +
                  MAX_PLACEABLES);
            }
            if (buf.length) {
              body.push(buf);
              buf = '';
            }
            this._index += 2;
            this.getWS();
            body.push(this.getExpression());
            this.getWS();
            if (!this._source.startsWith('}}', this._index)) {
              throw this.error('Expected "}}"');
            }
            this._index += 1;
            placeables++;
            break;
          }
          /* falls through */
        default:
          if (ch === opchar) {
            this._index++;
            closed = true;
            break;
          }

          buf += ch;
          if (this._index + 1 >= this._length) {
            throw this.error('Unclosed string literal');
          }
      }
    }

    if (buf.length) {
      body.push(buf);
    }

    const string = new AST.String(
      this._source.slice(start, this._index - 1), body);
    string.setPosition(start, this._index);
    string._opchar = opchar;

    return string;
  },

  getAttributes: function() {
    const attrs = [];

    while (true) {
      const attr = this.getAttribute();
      attrs.push(attr);
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

  getAttribute: function() {
    const start = this._index;
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
    const attr = new AST.Attribute(key, this.getValue(), index);
    attr.setPosition(start, this._index);
    return attr;
  },

  getHash: function() {
    const start = this._index;
    let items = [];

    ++this._index;
    this.getWS();

    while (true) {
      items.push(this.getHashItem());
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

    const hash = new AST.Hash(items);
    hash.setPosition(start, this._index);
    return hash;
  },

  getHashItem: function() {
    const start = this._index;

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

    const hashItem = new AST.HashItem(key, this.getValue(), defItem);
    hashItem.setPosition(start, this._index);
    return hashItem;
  },

  getComment: function() {
    this._index += 2;
    const start = this._index;
    const end = this._source.indexOf('*/', start);

    if (end === -1) {
      throw this.error('Comment without a closing tag');
    }

    this._index = end + 2;
    const comment = new AST.Comment(this._source.slice(start, end));
    comment.setPosition(start - 2, this._index);
    return comment;
  },

  getExpression: function () {
    const start = this._index;
    let exp = this.getPrimaryExpression();

    while (true) {
      let ch = this._source[this._index];
      if (ch === '.' || ch === '[') {
        ++this._index;
        exp = this.getPropertyExpression(exp, ch === '[', start);
      } else if (ch === '(') {
        ++this._index;
        exp = this.getCallExpression(exp, start);
      } else {
        break;
      }
    }

    return exp;
  },

  getPropertyExpression: function(idref, computed, start) {
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

    const propExpr = new AST.PropertyExpression(idref, exp, computed);
    propExpr.setPosition(start, this._index);
    return propExpr;
  },

  getCallExpression: function(callee, start) {
    this.getWS();

    const callExpr = new AST.CallExpression(callee,
      this.getItemList(this.getExpression, ')'));
    callExpr.setPosition(start, this._index);
    return callExpr;
  },

  getPrimaryExpression: function() {
    const start = this._index;
    const ch = this._source[this._index];

    switch (ch) {
      case '$':
        ++this._index;
        const variable = new AST.Variable(this.getIdentifier());
        variable.setPosition(start, this._index);
        return variable;
      case '@':
        ++this._index;
        const global = new AST.Global(this.getIdentifier());
        global.setPosition(start, this._index);
        return global;
      default:
        return this.getIdentifier();
    }
  },

  getItemList: function(callback, closeChar) {
    let items = [];
    let closed = false;

    this.getWS();

    if (this._source[this._index] === closeChar) {
      ++this._index;
      closed = true;
    }

    while (!closed) {
      items.push(callback.call(this));
      this.getWS();
      let ch = this._source.charAt(this._index);
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

  error: function(message) {
    const pos = this._index;

    let start = this._source.lastIndexOf('<', pos - 1);
    let lastClose = this._source.lastIndexOf('>', pos - 1);
    start = lastClose > start ? lastClose + 1 : start;
    let context = this._source.slice(start, pos + 10);

    let msg = message + ' at pos ' + pos + ': `' + context + '`';

    const err = new L10nError(msg);
    err._pos = {start: pos, end: undefined};
    err.offset = pos - start;
    err.description = message;
    err.context = context;
    return err;
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

    let nextEntry = Math.min(nextEntity, nextComment);

    this._index = nextEntry;

    const junk = new AST.JunkEntry(
      this._source.slice(this._curEntryStart, nextEntry));
    if (this._config.pos) {
      junk._pos = {start: this._curEntryStart, end: nextEntry};
    }
    return junk;
  }
};
