/*eslint no-magic-numbers: [0]*/

import AST from './ast';
import { L10nError } from '../../../errors';

const MAX_PLACEABLES = 100;


class ParseContext {
  constructor(string, pos) {
    this._config = {
      pos: pos
    };
    this._source = string;
    this._index = 0;
    this._length = string.length;
    this._curEntryStart = 0;
  } 

  setPosition(node, start, end) {
    if (!this._config.pos) {
      return;
    }
    node._pos = {start, end};
  }

  getResource() {
    const resource = new AST.Resource();
    this.setPosition(resource, 0, this._length);
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
  }

  getEntry() {
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
  }

  getEntity(id, index) {
    if (!this.getRequiredWS()) {
      throw this.error('Expected white space');
    }

    const ch = this._source.charAt(this._index);
    const hasIndex = index !== undefined;
    const value = this.getValue(ch, hasIndex, hasIndex);
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
    this.setPosition(entity, this._curEntryStart, this._index);
    return entity;
  }

  getValue(ch = this._source[this._index], index = false, required = true) {
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
    return null;
  }

  getWS() {
    let cc = this._source.charCodeAt(this._index);
    // space, \n, \t, \r
    while (cc === 32 || cc === 10 || cc === 9 || cc === 13) {
      cc = this._source.charCodeAt(++this._index);
    }
  }

  getRequiredWS() {
    const pos = this._index;
    let cc = this._source.charCodeAt(pos);
    // space, \n, \t, \r
    while (cc === 32 || cc === 10 || cc === 9 || cc === 13) {
      cc = this._source.charCodeAt(++this._index);
    }
    return this._index !== pos;
  }

  getIdentifier() {
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
    this.setPosition(id, start, this._index);
    return id;
  }

  getUnicodeChar() {
    for (let i = 0; i < 4; i++) {
      const cc = this._source.charCodeAt(++this._index);
      if ((cc > 96 && cc < 103) || // a-f
          (cc > 64 && cc < 71) ||  // A-F
          (cc > 47 && cc < 58)) {  // 0-9
        continue;
      }
      throw this.error('Illegal unicode escape sequence');
    }
    return '\\u' + this._source.slice(this._index - 3, this._index + 1);
  }

  getString(opchar, opcharLen) {
    const body = [];
    let buf = '';
    let placeables = 0;

    this._index += opcharLen - 1;

    const start = this._index + 1;

    let closed = false;

    while (!closed) {
      const ch = this._source[++this._index];
      
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
    this.setPosition(string, start, this._index);
    string._opchar = opchar;

    return string;
  }

  getAttributes() {
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
  }

  getAttribute() {
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
    const hasIndex = index !== undefined;
    const attr = new AST.Attribute(
      key,
      this.getValue(undefined, hasIndex),
      index);
    this.setPosition(attr, start, this._index);
    return attr;
  }

  getHash(index) {
    const start = this._index;
    const items = [];

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

    if (!index) {
      if (!items.some(item => item.default)) {
        throw this.error('Unresolvable Hash Value');
      }
    }

    const hash = new AST.Hash(items);
    this.setPosition(hash, start, this._index);
    return hash;
  }

  getHashItem() {
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
    this.setPosition(hashItem, start, this._index);
    return hashItem;
  }

  getComment() {
    this._index += 2;
    const start = this._index;
    const end = this._source.indexOf('*/', start);

    if (end === -1) {
      throw this.error('Comment without a closing tag');
    }

    this._index = end + 2;
    const comment = new AST.Comment(this._source.slice(start, end));
    this.setPosition(comment, start - 2, this._index);
    return comment;
  }

  getExpression() {
    const start = this._index;
    let exp = this.getPrimaryExpression();

    while (true) {
      const ch = this._source[this._index];
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
  }

  getPropertyExpression(idref, computed, start) {
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
    this.setPosition(propExpr, start, this._index);
    return propExpr;
  }

  getCallExpression(callee, start) {
    this.getWS();

    const callExpr = new AST.CallExpression(callee,
      this.getItemList(this.getExpression, ')'));
    this.setPosition(callExpr, start, this._index);
    return callExpr;
  }

  getPrimaryExpression() {
    const start = this._index;
    const ch = this._source[this._index];

    switch (ch) {
      case '$':
        ++this._index;
        const variable = new AST.Variable(this.getIdentifier());
        this.setPosition(variable, start, this._index);
        return variable;
      case '@':
        ++this._index;
        const global = new AST.Global(this.getIdentifier());
        this.setPosition(global, start, this._index);
        return global;
      default:
        return this.getIdentifier();
    }
  }

  getItemList(callback, closeChar) {
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
  }

  error(message) {
    const pos = this._index;

    let start = this._source.lastIndexOf('<', pos - 1);
    const lastClose = this._source.lastIndexOf('>', pos - 1);
    start = lastClose > start ? lastClose + 1 : start;
    const context = this._source.slice(start, pos + 10);

    const msg = message + ' at pos ' + pos + ': `' + context + '`';

    const err = new L10nError(msg);
    err._pos = {start: pos, end: undefined};
    err.offset = pos - start;
    err.description = message;
    err.context = context;
    return err;
  }

  getJunkEntry() {
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

    const junk = new AST.JunkEntry(
      this._source.slice(this._curEntryStart, nextEntry));

    this.setPosition(junk, this._curEntryStart, nextEntry);
    return junk;
  }
}

export default {
  parseResource: function(string, pos = false) {
    const parseContext = new ParseContext(string, pos);
    return parseContext.getResource();
  },
};
