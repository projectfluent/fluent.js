/*eslint no-magic-numbers: [0]*/

import AST from './ast';
import { L10nError } from '../../../errors';

const MAX_PLACEABLES = 100;


class ParseContext {
  constructor(string) {
    this._source = string;
    this._index = 0;
    this._length = string.length;
  }

  getResource() {
    const resource = new AST.Resource();
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
      this.getWS();
    }

    return resource;
  }

  getEntry() {
    if (this._index !== 0 &&
        this._source[this._index - 1] !== '\n') {
      throw this.error('Expected new line and a new entity identifier');
    }

    if (this._source[this._index] === '#') {
      return this.getComment();
    }
    return this.getEntity();
  }

  getEntity() {
    const id = this.getIdentifier(3);
    let members = [];
    let value = null;

    this.getLineWS();

    let ch = this._source[this._index];

    if (ch === '=') {
      this._index++;
      this.getLineWS();
      value = this.getPattern();

      ch = this._source[this._index];
    }

    if (ch === '\n') {
      this._index++;
      this.getLineWS();
      ch = this._source[this._index];
    }

    if (ch === '[' || ch === '*') {
      members = this.getMembers();
    } else if (value === null) {
      throw this.error(
  `Expected a value (like: " = value") or a trait (like: "[key] value")`);
    }

    return new AST.Entity(id, value, members);
  }

  getWS() {
    let cc = this._source.charCodeAt(this._index);
    // space, \n, \t, \r
    while (cc === 32 || cc === 10 || cc === 9 || cc === 13) {
      cc = this._source.charCodeAt(++this._index);
    }
  }

  getLineWS() {
    let cc = this._source.charCodeAt(this._index);
    // space, \t
    while (cc === 32 || cc === 9) {
      cc = this._source.charCodeAt(++this._index);
    }
  }

  getIdentifier(min = 2) {
    const start = this._index;
    let cc = this._source.charCodeAt(this._index);

    if ((cc >= 97 && cc <= 122) || // a-z
        (cc >= 65 && cc <= 90) ||  // A-Z
        cc === 95 || cc === 45) {  // _-
      cc = this._source.charCodeAt(++this._index);
    } else {
      throw this.error('Expected an identifier (starting with [a-zA-Z_-])');
    }

    while ((cc >= 97 && cc <= 122) || // a-z
           (cc >= 65 && cc <= 90) ||  // A-Z
           (cc >= 48 && cc <= 57) ||  // 0-9
           cc === 95 || cc === 45) {  // _-
      cc = this._source.charCodeAt(++this._index);
    }

    const id = this._source.slice(start, this._index);

    if (this._index - start < min) {
      throw this.error(`Identifier "${id}" is too short. Minimum length is ${min}`);
    }

    return id;
  }

  getSimpleString() {
    const start = this._index;
    let ch = this._source[this._index];

    while (this._index < this._length &&
           ch !== '=' && ch !== '$' && ch !== '[' &&
           ch !== ']' && ch !== '{' && ch !== '}' &&
           ch !== '(' && ch !== ')' && ch !== ':') {
      ch = this._source[++this._index];
    }
    return this._source.slice(start, this._index);
  }

  getPattern() {
    let buffer = '';
    let source = '';
    let content = [];
    let quoteDelimited = false;
    let firstLine = true;

    let ch = this._source[this._index];


    if (ch === '\\' &&
      this._source[this._index + 1] === '"' ||
      this._source[this._index + 1] === '{') {
      this._index++;
      ch = this._source[this._index];
    } else if (ch === '"') {
      quoteDelimited = true;
      this._index++;
      ch = this._source[this._index];
    }

    while (this._index < this._length) {
      if (ch === '\n') {
        if (quoteDelimited) {
          throw this.error('Unclosed string');
        }
        this._index++;
        this.getLineWS();
        if (this._source[this._index] !== '|') {
          break;
        }
        this._index++;
        if (this._source[this._index] === ' ') {
          this._index++;
        }
        if (buffer.length) {
          buffer += '\n';
        }
        ch = this._source[this._index];
        continue;
      } else if (ch === '\\') {
        let ch2 = this._source[this._index + 1];
        if ((quoteDelimited && ch2 === '"') ||
            ch2 === '{') {
          ch = ch2;
          this._index++;
        }
      } else if (quoteDelimited && ch === '"') {
        this._index++;
        break;
      } else if (ch === '{') {
        if (buffer.length) {
          content.push(new AST.TextElement(buffer));
        }
        source += buffer;
        buffer = ''
        let start = this._index;
        content.push(this.getPlaceable());
        source += this._source.substring(start, this._index);
        ch = this._source[this._index];
        continue;
      }

      if (ch) {
        buffer += ch;
      }
      this._index++;
      ch = this._source[this._index];
    }

    if (buffer.length) {
      source += buffer;
      content.push(new AST.TextElement(buffer));
    }

    if (content.length === 0) {
      content.push(new AST.TextElement(source));
    }

    return new AST.Pattern(source, content);
  }

  getPlaceable() {
    this._index++;

    let expressions = [];
    
    while (this._source[this._index] !== '}') {
      this.getWS();
      let start = this._index;
      try {
        expressions.push(this.getPlaceableExpression());
      } catch (e) {
        throw this.error(e.description, start);
      }
      this.getWS();
      if (this._source[this._index] !== ',') {
        break;
      }
      this._index++;
    }

    if (this._source[this._index] !== '}') {
      throw this.error('Expected "}" to close the placeable');
    }

    this._index++;
    return new AST.Placeable(expressions);
  }

  getPlaceableExpression() {
    let selector = this.getCallExpression();
    let members = null;

    this.getWS();

    if (this._source[this._index] !== '}' &&
        this._source[this._index] !== ',') {
      if (this._source[this._index] !== '-' ||
          this._source[this._index + 1] !== '>') {
        throw this.error('Expected "}", "," or "->"');
      }
      this._index += 2; // ->

      this.getWS();

      members = this.getMembers();

      if (members.length === 0) {
        throw this.error('Expected members for the select expression');
      }
    }

    if (members === null) {
      return selector;
    }
    return new AST.SelectExpression(selector, members);
  }

  getCallExpression() {
    let exp = this.getMemberExpression();

    if (this._source[this._index] !== '(') {
      return exp;
    }

    this._index++;

    let args = this.getCallArgs();

    this._index++;

    if (exp instanceof AST.EntityReference) {
      exp = new AST.BuiltinReference(exp.id);
    }

    return new AST.CallExpression(exp, args);
  }

  getCallArgs() {
    let args = [];

    if (this._source[this._index] === ')') {
      return args;
    }

    while (this._index < this._length) {
      this.getLineWS();

      let exp = this.getCallExpression();

      if (!(exp instanceof AST.EntityReference)) {
        args.push(exp);
      } else {
        this.getLineWS();

        if (this._source[this._index] === '=') {
          this._index++;
          this.getLineWS();

          let val = this.getCallExpression();

          args.push(new AST.KeyValueArg(exp.id, val));
        } else {
          args.push(exp);
        }
      }

      this.getLineWS();

      if (this._source[this._index] === ')') {
        break;
      } else if (this._source[this._index] === ',') {
        this._index++;
      } else {
        throw this.error('Expected "," or ")"');
      }
    }

    return args;
  }

  getNumber() {
    let num = '';
    let cc = this._source.charCodeAt(this._index);

    if (cc === 45) {
      num += '-';
      cc = this._source.charCodeAt(++this._index);
    }

    if (cc < 48 || cc > 57) {
      throw this.error(`Unknown literal "${num}"`);
    }

    while (cc >= 48 && cc <= 57) {
      num += this._source[this._index++];
      cc = this._source.charCodeAt(this._index);
    }

    if (cc === 46) {
      num += this._source[this._index++];
      cc = this._source.charCodeAt(this._index);

      if (cc <= 48 || cc >= 57) {
        throw this.error(`Unknown literal "${num}"`);
      }

      while (cc >= 48 && cc <= 57) {
        num += this._source[this._index++];
        cc = this._source.charCodeAt(this._index);
      }
    }

    return new AST.Number(num);
  }

  getMemberExpression() {
    const exp = this.getLiteral();

    if (this._source[this._index] !== '[') {
      return exp;
    }
    const keyword = this.getKeyword();
    return new AST.MemberExpression(exp, keyword);
  }

  getMembers() {
    const members = [];

    while (this._index < this._length) {
      if (this._source[this._index] !== '[' &&
          this._source[this._index] !== '*') {
        break;
      }
      let def = false;
      if (this._source[this._index] === '*') { 
        this._index++;
        def = true;
      }
      let key = this.getKeyword();

      this.getLineWS();

      let value = this.getPattern();

      let member = new AST.Member(key, value, def);

      members.push(member);

      this.getWS();
    }

    return members;
  }

  getKeyword() {
    this._index++;

    let cc = this._source.charCodeAt(this._index);
    let literal;

    if ((cc >= 48 && cc <= 57) || cc === 45) {
      literal = this.getNumber();
    } else if (cc !== 61 && cc !== 36 && cc !== 91 &&    // =$[
               cc !== 93 && cc !== 123 && cc !== 125 &&  // ]{}
               cc !== 40 && cc !== 41 && cc !== 58) {    // ():
      literal = new AST.Keyword(this.getSimpleString());
    } else {
      throw this.error('Expected Number or String keyword');
    }

    if (this._source[this._index] !== ']') {
      throw this.error('Expected "]"');
    }

    this._index++;
    return literal;
  }

  getLiteral() {
    let cc = this._source.charCodeAt(this._index);
    if ((cc >= 48 && cc <= 57) || cc === 45) {
      return this.getNumber();
    } else if (cc === 34) { // "
      return this.getPattern();
    } else if (cc === 36) { // $
      this._index++;
      return new AST.Variable(this.getIdentifier());
    }
    return new AST.EntityReference(this.getIdentifier());
  }

  getComment() {
    this._index++;
    let content = '';

    let eol = this._source.indexOf('\n', this._index);

    content += this._source.substring(this._index, eol);

    while (eol !== -1 && this._source[eol + 1] === '#') {
      this._index = eol + 2;

      eol = this._source.indexOf('\n', this._index);

      if (eol === -1) {
        break;
      }

      content += '\n' + this._source.substring(this._index, eol);
    }

    if (eol === -1) {
      this._index = this._length;
    } else {
      this._index = eol + 1;
    }

    return new AST.Comment(content);
  }

  error(message, start=null) {
    let colors = require('colors/safe');

    const pos = this._index;

    if (start === null) {
      start = pos;
    }
    start = this._findEntityStart(start);

    let pre = this._source.slice(start, pos);
    if (start === 0) {
      pre = '\n' + pre;
    }
    if (pre.endsWith('\n')) {
      pre = pre.slice(0, -1);
    }
    pre = colors.yellow(pre);

    let post = '';
    if (pos < this._length) {
      if (this._source[pos] === ' ') {
        post = colors.bold(colors.bgRed(' '));
      } else if (this._source[pos] === '\n') {
        post = colors.bold(colors.bgRed(' \n'));
      } else {
        post = colors.bold(colors.red(this._source[pos]));
      }
      post += colors.gray(this._source.slice(pos + 1, pos + 10));
      post += colors.gray('…');
    } else {
      post = colors.bold(colors.bgRed(' '));
    }

    let context = pre + post;
    const msg = '\n\n  ' + colors.white(message) +
      colors.red('\nat pos ' + pos + ':\n------\n') +
      colors.gray('…') +
      context +
      colors.red('\n------');
    const err = new L10nError(msg);
    err._pos = {start: pos, end: undefined};
    err.offset = pos - start;
    err.description = message;
    err.context = context;
    return err;
  }

  getJunkEntry() {
    const pos = this._index;

    let nextEntity = this._source.indexOf('\n', pos);

    if (nextEntity === -1) {
      nextEntity = this._length;
    }

    this._index = nextEntity;

    let entityStart = this._findEntityStart(pos);

    const junk = new AST.JunkEntry(
      this._source.slice(entityStart, nextEntity));
    return junk;
  }

  _findEntityStart(pos) {
    let start = pos;

    while (true) {
      start = this._source.lastIndexOf('\n', start - 2);
      if (start === -1) {
        start = 0;
        break;
      }
      let cc = this._source.charCodeAt(start + 1);

      if ((cc >= 97 && cc <= 122) || // a-z
          (cc >= 65 && cc <= 90) ||  // A-Z
           cc === 95 || cc === 45) {  // _-
        start++;
        break;
      }
    }

    return start;
  }
}

export default {
  parseResource: function(string) {
    const parseContext = new ParseContext(string);
    return parseContext.getResource();
  },
};
