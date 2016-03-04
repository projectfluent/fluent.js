
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
      resource.body.push(this.getEntry());
      if (this._index < this._length) {
        this.getWS();
      }
    }

    return resource;
  }

  getEntry() {
    if (this._index === 0 ||
        this._source[this._index - 1] === '\n') {

      if (this._source[this._index] === '#') {
        return this.getComment();
      }
      return this.getEntity();
    }

    throw new Error('Invalid entry');
  }

  getEntity() {
    const id = this.getIdentifier();
    let members = [];
    let value = null;

    this.getLineWS();

    let ch = this._source[this._index];

    if (ch === '=') {
      this._index++;
      this.getLineWS();
      value = this.getString();

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
      throw new Error('Expected "[" or "*"');
    }

    const entity = new AST.Entity(id, value, members);
    return entity;
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
    const start = this._index;
    let cc = this._source.charCodeAt(this._index);

    if ((cc >= 97 && cc <= 122) || // a-z
        (cc >= 65 && cc <= 90) ||  // A-Z
        cc === 95) {               // _
      cc = this._source.charCodeAt(++this._index);
    } else {
      throw new Error('Identifier has to start with [a-zA-Z_]');
    }

    while ((cc >= 97 && cc <= 122) || // a-z
           (cc >= 65 && cc <= 90) ||  // A-Z
           (cc >= 48 && cc <= 57) ||  // 0-9
           cc === 95 || cc === 45) {  // _-
      cc = this._source.charCodeAt(++this._index);
    }

    return this._source.slice(start, this._index);
  }

  getSimpleString() {
    const start = this._index;
    let cc = this._source.charCodeAt(this._index);

    while ((cc >= 97 && cc <= 122) || // a-z
           (cc >= 65 && cc <= 90) ||  // A-Z
           (cc >= 48 && cc <= 57) ||  // 0-9
           cc === 95 || cc === 45 || cc === 32) {  // _-
      cc = this._source.charCodeAt(++this._index);
    }
    return this._source.slice(start, this._index);
  }

  getString() {
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
          throw new Error('Unclosed string');
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
        buffer = '';
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
      content.push(source);
    }

    return new AST.String(source, content);
  }

  getPlaceable() {
    this._index++;
    let start = this._index;

    let expressions = [];
    
    while (this._source[this._index] !== '}') {
      this.getWS();
      expressions.push(this.getPlaceableExpression());
      this.getWS();
      if (this._source[this._index] !== ',') {
        break;
      }
      this._index++;
    }

    this._index++;
    return new AST.Placeable(expressions,
      this._source.substring(start, this._index - 1));
  }

  getPlaceableExpression() {
    let selector = this.getCallExpression();
    let members = null;

    this.getWS();

    if (this._source[this._index] !== '}' &&
        this._source[this._index] !== ',') {
      this._index += 2; // ->

      this.getWS();

      members = this.getMembers();

      if (members.length === 0) {
        throw new Error('Expected members');
      }
    }

    return new AST.PlaceableExpression(selector, members);
  }

  getCallExpression() {
    let exp = this.getMemberExpression();

    if (this._source[this._index] !== '(') {
      return exp;
    }

    this._index++;

    let args = this.getCallArgs();

    this._index++;

    return new AST.CallExpression(exp, args);
  }

  getCallArgs() {
    let args = [];

    if (this._source[this._index] === ')') {
      return args;
    }

    while (this._index < this._length) {
      this.getWS();

      let cc = this._source.charCodeAt(this._index);
      let ch = this._source[this._index];

      let exp = this.getCallExpression();

      if (!(exp instanceof AST.EntityReference)) {
        args.push(exp);
      } else {
        this.getWS();

        if (this._source[this._index] === '=') {
          this._index++;
          this.getWS();

          let val = this.getCallExpression();

          args.push(new AST.KeyValueArg(exp.id, val));
        } else {
          args.push(exp);
        }
      }

      this.getWS();

      if (this._source[this._index] === ')') {
        break;
      } else if (this._source[this._index] === ',') {
        this._index++;
      } else {
        throw new Error('Expected "," or ")"');
      }
    }

    return args;
  }

  getNumber() {
    let num = this._source[this._index++];
    let cc = this._source.charCodeAt(this._index);

    if (cc === 45) {
      num += '-';
      cc = this._source[++this._index];
    }

    while (cc >= 48 && cc <= 57 ||
           cc === 46) { // .
      num += this._source[this._index++];
      cc = this._source.charCodeAt(this._index);
    }

    if (num.endsWith('.')) {
      throw new Error('Unknown literal');
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

      let value = this.getString();

      let member = new AST.Member(key, value, def);

      members.push(member);

      this.getWS();
    }

    return members;
  }

  getKeyword() {
    this._index++;

    const start = this._index;
    let cc = this._source.charCodeAt(this._index);
    let literal;

    if ((cc >= 48 && cc <= 57) || cc === 45) {
      literal = this.getNumber();
    } else if ((cc >= 97 && cc <= 122) || // a-z
               (cc >= 65 && cc <= 90) ||  // A-Z
                cc === 95 || cc === 45) { // _-
      literal = this.getSimpleString();
    }

    this._index++;
    return literal;
  }

  getLiteral() {
    let cc = this._source.charCodeAt(this._index);
    if ((cc >= 48 && cc <= 57) || cc === 45) {
      return this.getNumber();
    } else if (cc === 34) { // "
      return this.getString();
    } else if (cc === 36) { // $
      this._index++;
      return new AST.Variable(this.getIdentifier());
    }
    return new AST.EntityReference(this.getIdentifier());
  }

  getVariable() {
    if (this._source[this._index] === '$') {
      this._index++;
      const id = this.getIdentifier();

      return new AST.Variable(id);
    }
    return this.getIdentifier();
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
}

export default {
  parseResource: function(string) {
    const parseContext = new ParseContext(string);
    return parseContext.getResource();
  },
};
