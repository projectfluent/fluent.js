/*eslint no-magic-numbers: [0]*/

import { L10nError } from '../../../errors';

const MAX_PLACEABLES = 100;


class ParseContext {
  constructor(string) {
    this._source = string;
    this._index = 0;
    this._length = string.length;

    this._lastGoodEntryEnd = 0;
  }

  getResource() {
    const entries = {};
    const errors = [];

    this.getWS();
    while (this._index < this._length) {
      try {
        let entry = this.getEntry();
        if (!entry) {
          this.getWS();
          continue;
        }

        const id = entry.id;
        entries[id] = {};

        if (entry.traits !== null &&
           entry.traits.length !== 0) {
          entries[id].traits = entry.traits;
          if (entry.value) {
            entries[id].val = entry.value;
          }
        } else {
          entries[id] = entry.value;
        }
        this._lastGoodEntryEnd = this._index;
      } catch (e) {
        if (e instanceof L10nError) {
          errors.push(e);
          this.getJunkEntry();
        } else {
          throw e;
        }
      }
      this.getWS();
    }

    return [entries, errors];
  }

  getEntry() {
    if (this._index !== 0 &&
        this._source[this._index - 1] !== '\n') {
      throw this.error('Expected new line and a new entry');
    }

    if (this._source[this._index] === '#') {
      this.getComment();
      return;
    }

    if (this._source[this._index] === '[') {
      this.getSection();
      return;
    }

    if (this._index < this._length &&
        this._source[this._index] !== '\n') {
      return this.getEntity();
    }
  }

  getSection(comment = null) {
    this._index += 1;
    if (this._source[this._index] !== '[') {
      throw this.error('Expected "[[" to open a section');
    }

    this._index += 1;

    this.getLineWS();
    this.getKeyword();
    this.getLineWS();

    if (this._source[this._index] !== ']' ||
        this._source[this._index + 1] !== ']') {
      throw this.error('Expected "]]" to close a section');
    }

    this._index += 2;

    // sections are ignored in the runtime ast
    return undefined;
  }

  getEntity(comment = null) {
    const id = this.getIdentifier();

    let traits = null;
    let value = null;

    this.getLineWS();

    let ch = this._source[this._index];

    if (ch !== '=') {
      throw this.error('Expected "=" after Entity ID');
    }
    ch = this._source[++this._index];

    this.getLineWS();

    value = this.getPattern();

    ch = this._source[this._index];

    if (ch === '\n') {
      this._index++;
      this.getLineWS();
      ch = this._source[this._index];
    }

    if ((ch === '[' && this._source[this._index + 1] !== '[') ||
        ch === '*') {
      traits = this.getMembers();
    } else if (value === null) {
      throw this.error(
        `Expected a value (like: " = value") or a trait (like: "[key] value")`
      );
    }

    return {
      id,
      value,
      traits
    };
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

  getIdentifier() {
    let name = '';

    const start = this._index;
    let cc = this._source.charCodeAt(this._index);

    if ((cc >= 97 && cc <= 122) || // a-z
        (cc >= 65 && cc <= 90) ||  // A-Z
        cc === 95) {               // _
      cc = this._source.charCodeAt(++this._index);
    } else if (name.length === 0) {
      throw this.error('Expected an identifier (starting with [a-zA-Z_])');
    }

    while ((cc >= 97 && cc <= 122) || // a-z
           (cc >= 65 && cc <= 90) ||  // A-Z
           (cc >= 48 && cc <= 57) ||  // 0-9
           cc === 95 || cc === 45) {  // _-
      cc = this._source.charCodeAt(++this._index);
    }

    name += this._source.slice(start, this._index);

    return name;
  }

  getKeyword() {
    let name = '';
    let namespace = this.getIdentifier();

    if (this._source[this._index] === '/') {
      this._index++;
    } else if (namespace) {
      name = namespace;
      namespace = null;
    }

    const start = this._index;
    let cc = this._source.charCodeAt(this._index);

    if ((cc >= 97 && cc <= 122) || // a-z
        (cc >= 65 && cc <= 90) ||  // A-Z
        cc === 95 || cc === 32) {  //  _
      cc = this._source.charCodeAt(++this._index);
    } else if (name.length === 0) {
      throw this.error('Expected an identifier (starting with [a-zA-Z_])');
    }

    while ((cc >= 97 && cc <= 122) || // a-z
           (cc >= 65 && cc <= 90) ||  // A-Z
           (cc >= 48 && cc <= 57) ||  // 0-9
           cc === 95 || cc === 45 || cc === 32) {  //  _-
      cc = this._source.charCodeAt(++this._index);
    }

    name += this._source.slice(start, this._index).trimRight();

    return namespace ?
      { type: 'kw', ns: namespace, name } :
      { type: 'kw', name };
  }

  getPattern() {
    let start = this._index;
    if (this._source[start] === '"') {
      return this.getComplexPattern();
    }
    let eol = this._source.indexOf('\n', this._index);

    if (eol === -1) {
      eol = this._length;
    }

    let line = this._source.slice(start, eol);

    if (line.indexOf('{') !== -1) {
      return this.getComplexPattern();
    }

    this._index = eol + 1;

    this.getWS();

    if (this._source[this._index] === '|') {
      this._index = start;
      return this.getComplexPattern();
    }

    return this._source.slice(start, eol);
  }

  getComplexPattern() {
    let buffer = '';
    let content = [];
    let quoteDelimited = null;
    let firstLine = true;

    let ch = this._source[this._index];


    if (ch === '\\' &&
      (this._source[this._index + 1] === '"' ||
       this._source[this._index + 1] === '{' ||
       this._source[this._index + 1] === '\\')) {
      buffer += this._source[this._index + 1];
      this._index += 2;
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
        if (firstLine && buffer.length) {
          throw this.error('Multiline string should have the ID line empty');
        }
        firstLine = false;
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
        quoteDelimited = false;
        break;
      } else if (ch === '{') {
        if (buffer.length) {
          content.push(buffer);
        }
        buffer = ''
        let start = this._index;
        content.push(this.getPlaceable());
        ch = this._source[this._index];
        continue;
      }

      if (ch) {
        buffer += ch;
      }
      this._index++;
      ch = this._source[this._index];
    }

    if (quoteDelimited) {
      throw this.error('Unclosed string');
    }

    if (buffer.length) {
      content.push(buffer);
    }

    if (content.length === 0) {
      if (quoteDelimited !== null) {
        return '';
      } else {
        return null;
      }
    }

    if (content.length === 1 &&
        typeof content[0] === 'string') {
      return content[0];
    }

    return content;
  }

  getPlaceable() {
    this._index++;

    let expressions = [];

    this.getLineWS();

    while (this._index < this._length) {
      let start = this._index;
      try {
        expressions.push(this.getPlaceableExpression());
      } catch (e) {
        throw this.error(e.description, start);
      }
      this.getWS();
      if (this._source[this._index] === '}') {
        this._index++;
        break;
      } else if (this._source[this._index] === ',') {
        this._index++;
        this.getWS();
      } else {
        throw this.error('Expected "}" or ","');
      }
    }

    return expressions;
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

      this.getLineWS();

      if (this._source[this._index] !== '\n') {
        throw this.error('Members should be listed in a new line');
      }

      this.getWS();

      members = this.getMembers();

      if (members.length === 0) {
        throw this.error('Expected members for the select expression');
      }
    }

    if (members === null) {
      return selector;
    }
    return {
      type: 'sel',
      exp: selector,
      vars: members
    };
  }

  getCallExpression() {
    let exp = this.getMemberExpression();

    if (this._source[this._index] !== '(') {
      return exp;
    }

    this._index++;

    let args = this.getCallArgs();

    this._index++;

    if (exp.type = 'ref') {
      exp.type = 'blt';
    }

    return {
      type: 'call',
      name: exp,
      args
    };
  }

  getCallArgs() {
    let args = [];

    if (this._source[this._index] === ')') {
      return args;
    }

    while (this._index < this._length) {
      this.getLineWS();

      let exp = this.getCallExpression();

      if (exp.type !== 'ref' ||
         exp.namespace !== undefined) {
        args.push(exp);
      } else {
        this.getLineWS();

        if (this._source[this._index] === ':') {
          this._index++;
          this.getLineWS();

          let val = this.getCallExpression();

          if (val.type === 'ref' ||
              val.type === 'member') {
            this._index = this._source.lastIndexOf('=', this._index) + 1;
            throw this.error('Expected string in quotes');
          }

          args.push({
            type: 'kv',
            name: exp.name,
            val
          });
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

      if (cc < 48 || cc > 57) {
        throw this.error(`Unknown literal "${num}"`);
      }

      while (cc >= 48 && cc <= 57) {
        num += this._source[this._index++];
        cc = this._source.charCodeAt(this._index);
      }
    }

    return {
      type: 'num',
      val: num
    };
  }

  getMemberExpression() {
    let exp = this.getLiteral();

    while (this._source[this._index] === '[') {
      let keyword = this.getMemberKey();
      exp = {
        type: 'mem',
        key: keyword,
        obj: exp
      };
    }

    return exp;
  }

  getMembers() {
    const members = [];

    while (this._index < this._length) {
      if ((this._source[this._index] !== '[' ||
           this._source[this._index + 1] === '[') &&
          this._source[this._index] !== '*') {
        break;
      }
      let def = false;
      if (this._source[this._index] === '*') { 
        this._index++;
        def = true;
      }

      if (this._source[this._index] !== '[') {
        throw this.error('Expected "["');
      }

      let key = this.getMemberKey();

      this.getLineWS();

      let value = this.getPattern();

      let member = {
        key,
        val: value
      };
      if (def) {
        member.def = true;
      }
      members.push(member);

      this.getWS();
    }

    return members;
  }

  getMemberKey() {
    this._index++;

    let cc = this._source.charCodeAt(this._index);
    let literal;

    if ((cc >= 48 && cc <= 57) || cc === 45) {
      literal = this.getNumber();
    } else {
      literal = this.getKeyword();
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
      return {
        type: 'ext',
        name: this.getIdentifier()
      };
    }

    return {
      type: 'ref',
      name: this.getIdentifier()
    };
  }

  getComment() {
    let eol = this._source.indexOf('\n', this._index);

    while (eol !== -1 && this._source[eol + 1] === '#') {
      this._index = eol + 2;

      eol = this._source.indexOf('\n', this._index);

      if (eol === -1) {
        break;
      }
    }

    if (eol === -1) {
      this._index = this._length;
    } else {
      this._index = eol + 1;
    }
  }

  error(message, start=null) {
    let colors = require('colors/safe');

    const pos = this._index;

    if (start === null) {
      start = pos;
    }
    start = this._findEntityStart(start);

    let context = this._source.slice(start, pos + 10);

    const msg = '\n\n  ' + message +
      '\nat pos ' + pos + ':\n------\n…' + context + '\n------';
    const err = new L10nError(msg);

    let row = this._source.slice(0, pos).split('\n').length;
    let col = pos - this._source.lastIndexOf('\n', pos - 1);
    err._pos = {start: pos, end: undefined, col: col, row: row};
    err.offset = pos - start;
    err.description = message;
    err.context = context;
    return err;
  }

  getJunkEntry() {
    const pos = this._index;

    let nextEntity = this._findNextEntryStart(pos);

    if (nextEntity === -1) {
      nextEntity = this._length;
    }

    this._index = nextEntity;

    let entityStart = this._findEntityStart(pos);

    if (entityStart < this._lastGoodEntryEnd) {
      entityStart = this._lastGoodEntryEnd;
    }
  }

  _findEntityStart(pos) {
    let start = pos;

    while (true) {
      start = this._source.lastIndexOf('\n', start - 2);
      if (start === -1 || start === 0) {
        start = 0;
        break;
      }
      let cc = this._source.charCodeAt(start + 1);

      if ((cc >= 97 && cc <= 122) || // a-z
          (cc >= 65 && cc <= 90) ||  // A-Z
           cc === 95) {              // _
        start++;
        break;
      }
    }

    return start;
  }

  _findNextEntryStart(pos) {
    let start = pos;

    while (true) {
      if (start === 0 ||
          this._source[start - 1] === '\n') {
        let cc = this._source.charCodeAt(start);

        if ((cc >= 97 && cc <= 122) || // a-z
            (cc >= 65 && cc <= 90) ||  // A-Z
             cc === 95 || cc === 35 || cc === 91) {  // _#[
          break;
        }
      }

      start = this._source.indexOf('\n', start);

      if (start === -1) {
        break;
      }
      start++;
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
