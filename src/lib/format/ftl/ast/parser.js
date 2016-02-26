
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
      return this.getEntity();
    }

    throw new Error('Invalid entry');
  }

  getEntity() {
    const id = this.getIdentifier();
    let members = [];
    let value = null;

    this.getWS();

    if (this._source.charAt(this._index++) !== '=') {
      throw new Error();
    }

    this.getWS();
    
    if (this._source.charAt(this._index) !== '[') {
      value = this.getValue();
    }

    if (this._source.charAt(this._index) === '[') {
      members = this.getMembers();
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

    return new AST.Identifier(this._source.slice(start, this._index));
  }

  getValue() {
    this.getWS();
    if (this._source.charAt(this._index) === '[') {
      return this.getHash();
    } else {
      return this.getString();
    }
  }

  getString() {
    let start = this._index;
    let source = '';
    let content = [];

    let ch = this._source.charAt(this._index);

    if (ch === '|') {
      start++;
      ch = this._source.charAt(++this._index);
    }

    if (ch === ' ') {
      start++;
      ch = this._source.charAt(++this._index);
    }

    while (this._index < this._length) {
      while (this._index < this._length &&
          ch !== '\n' && ch !== '\\' && ch !== '{') {
        ch = this._source.charAt(++this._index);
      }

      if (start < this._index) {
        let chunk = this._source.slice(start, this._index);
        source += chunk;
        if (content.length > 0 &&
            typeof content[content.length - 1] === 'string') {
          content[content.length - 1] += '\n' + chunk;
        } else {
          content.push(chunk);
        }
      }

      if (ch === '{') {
        start = this._index;
        content.push(this.getPlaceable());
        source += this._source.slice(start, this._index);
        start = this._index;
        ch = this._source.charAt(this._index);
      } else {
        this.getWS();

        ch = this._source.charAt(this._index);

        if (ch === '|') {
          this._index++;
          start = this._index;
          source += '\n';

          ch = this._source.charAt(this._index);

          if (ch === ' ') {
            start++;
            this._index++;
            ch = this._source.charAt(this._index);
          }
        } else {
          break;
        }
      }
    }

    return new AST.String(source, content);
  }

  getMembers() {
    const members = [];

    while (this._index < this._length) {
      let key = this.getKeyword();
      let value = this.getValue();

      let member = new AST.Member(key, value);

      members.push(member);
    }

    return members;
  }

  getPlaceable() {
    this._index++;
    this.getWS();
    let ch = this._source[this._index];

    let exp = null;

    if (ch === '[' || ch === '*') {
      exp = new AST.SelectExpression(null, this.getVariants());
    } else {
      exp = this.getSelectExpression();
    }

    this.getWS();
    
    if (this._source.charAt(this._index) !== '}') {
      throw new Error('Expected "}"');
    }
    this._index++;
    return new AST.Placeable(exp);
  }

  getSelectExpression() {
    let selector = this.getSelector();

    this.getWS();

    if (this._source[this._index] === '}') {
      return selector;
    }

    this._index += 2; // ->

    this.getWS();

    let variants = this.getVariants();

    return new AST.SelectExpression(selector, variants);
  }

  getSelector() {
    return this.getVariable();
  }

  getVariants() {
    const variants = [];

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
      let value = this.getValue();

      let variant = new AST.Variant(key, value, def);

      variants.push(variant);
    }

    return variants;
  }

  getKeyword() {
    this._index++;
    let id = this.getIdentifier();
    this._index++;
    return id;
  }

  getVariable() {
    if (this._source[this._index] === '$') {
      this._index++;
      const id = this.getIdentifier();

      return new AST.Variable(id);
    }
    return this.getIdentifier();
  }
}

export default {
  parseResource: function(string) {
    const parseContext = new ParseContext(string);
    return parseContext.getResource();
  },
};
