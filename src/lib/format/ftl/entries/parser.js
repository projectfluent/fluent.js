import { L10nError } from '../../../errors';

const MAX_PLACEABLES = 100;


export default {
  parse: function(emit, string) {
    this._source = string;
    this._index = 0;
    this._length = string.length;
    this.emit = emit;

    return this.getResource();
  },

  getResource: function() {
    this.entries = Object.create(null);
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
    if (this._index !== 0 &&
        this._source[this._index - 1] !== '\n') {
      throw this.error('Expected new line and a new entry');
    }

    let comment;

    if (this._source[this._index] === '#') {
      comment = this.getComment();
    }

    this.getLineWS();

    if (this._source[this._index] === '[') {
      return this.getSection(comment);
    }

    if (this._index < this._length &&
        this._source[this._index] !== '\n') {
      return this.getEntity(comment);
    }
    return comment;
  },

  getEntity: function() {
    let id = this.getIdentifier(':');

    let members = [];
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
      members = this.getMembers();
    } else if (value === null) {
      throw this.error(
  `Expected a value (like: " = value") or a trait (like: "[key] value")`);
    }

    this.entries[id.name] = {
      value,
      members
    };
  },

  getIdentifier: function(nsSep=null) {
    let namespace = null;
    let name = '';

    if (nsSep) {
      namespace = this.getIdentifier().name;
      if (this._source[this._index] === nsSep) {
        this._index++;
      } else if (namespace) {
        name = namespace;
        namespace = null; 
      }
    }

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

    return {name, namespace};
  },
  getPattern() {
    let buffer = '';
    let source = '';
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

    if (quoteDelimited) {
      throw this.error('Unclosed string');
    }

    if (buffer.length) {
      source += buffer;
      content.push(buffer);
    }

    if (content.length === 0) {
      if (quoteDelimited !== null) {
        content.push(source);
      } else {
        return null;
      }
    }

    return content;
  },
  getPlaceable() {
    this._index++;

    let expressions = [];

    this.getLineWS();

    while (this._index < this._length) {
      let start = this._index;
      try {
        expressions.push(this.getPlaceableExpression());
      } catch (e) {
        if (e instanceof L10nError) {
          let diff = start - e._pos.start;
          e._pos.start -= diff;
          e.offset -= diff; 
          throw e;
        } else {
          throw this.error(e);
        }
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
  },

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
      type: 'select',
      selector: selector,
      members: members
    };
  },
  getCallExpression() {
    let exp = this.getMemberExpression();

    if (this._source[this._index] !== '(') {
      return exp;
    }

    this._index++;

    let args = this.getCallArgs();

    this._index++;

    return {
      type: 'call',
      exp,
      args
    };
  },
  getCallArgs() {
    let args = [];

    if (this._source[this._index] === ')') {
      return args;
    }

    while (this._index < this._length) {
      this.getLineWS();

      let exp = this.getCallExpression();

      if (!exp.hasOwnProperty('name') ||
         exp.namespace !== null) {
        args.push(exp);
      } else {
        this.getLineWS();

        if (this._source[this._index] === '=') {
          this._index++;
          this.getLineWS();

          let val = this.getCallExpression();

          if (val instanceof AST.EntityReference ||
              val instanceof AST.MemberExpression) {
            this._index = this._source.lastIndexOf('=', this._index) + 1;
            throw this.error('Expected string in quotes');
          }

          args.push(new AST.KeyValueArg(exp.name, val));
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
  },
  getMemberExpression() {
    const exp = this.getLiteral();

    if (this._source[this._index] !== '[') {
      return exp;
    }
    const keyword = this.getKeyword();
    return {
      type: 'member',
      exp,
      keyword
    }
  },
  getLiteral() {
    let cc = this._source.charCodeAt(this._index);
    if ((cc >= 48 && cc <= 57) || cc === 45) {
      return this.getNumber();
    } else if (cc === 34) { // "
      return this.getPattern();
    } else if (cc === 36) { // $
      this._index++;
      let id = this.getIdentifier();
      return {
        type: 'external',
        id: id.name
      };
    }

    let id = this.getIdentifier(':');
    return id;
  },
  getComment: function() {
    let lineEnd = this._source.indexOf('\n', this._index);

    if (lineEnd === -1) {
      lineEnd = this._length;
    }

    this._index =  lineEnd;
  },

  getMembers: function() {
    const members = {};

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

      let key = this.getKeyword();

      this.getLineWS();

      let value = this.getPattern();

      members[key] = value;

      this.getWS();
    }

    return members;
  },

  getKeyword: function() {
    this._index++;

    let cc = this._source.charCodeAt(this._index);
    let literal;

    if ((cc >= 48 && cc <= 57) || cc === 45) {
      literal = this.getNumber();
    } else {
      literal = this.getIdentifier(':');
    }

    if (this._source[this._index] !== ']') {
      throw this.error('Expected "]"');
    }

    this._index++;
    return literal;
  },

  getWS: function() {
    let cc = this._source.charCodeAt(this._index);
    // space, \n, \t, \r
    while (cc === 32 || cc === 10 || cc === 9 || cc === 13) {
      cc = this._source.charCodeAt(++this._index);
    }
  },

  getLineWS() {
    let cc = this._source.charCodeAt(this._index);
    // space, \t
    while (cc === 32 || cc === 9) {
      cc = this._source.charCodeAt(++this._index);
    }
  },

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
  },
  getJunkEntry() {
    const pos = this._index;

    let nextEntity = this._findNextEntryStart(pos);

    if (nextEntity === -1) {
      nextEntity = this._length;
    }

    this._index = nextEntity;
  },
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
  },
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
};
