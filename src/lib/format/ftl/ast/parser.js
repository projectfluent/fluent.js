
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
    let traits = [];
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
      traits = this.getTraits();
    }

    const entity = new AST.Entity(id, value, traits);
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
    return this.getString();
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
          ch !== '\n' && ch !== '\\' && ch !== '{' && ch !== '}') {
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

  getTraits() {
    const traits = [];

    while (this._index < this._length) {
      let key = this.getKeyword();

      this.getWS();

      let value = this.getValue();

      let trait = new AST.Trait(key, value);

      traits.push(trait);
    }

    return traits;
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

    while (this._index < this._length) {
      this.getWS();

      let cc = this._source.charCodeAt(this._index);

      if (cc >= 48 && cc <= 57) {
        args.push(this.getNumber());
      } else {
        let exp = this.getVariable();
        
        if (exp instanceof AST.Variable) {
          args.push(exp);
        } else {
          this.getWS();

          if (this._source[this._index] === '=') {
            this._index++;
            this.getWS();

            let val = this.getArgumentValue();

            args.push(new AST.KeyValueArg(exp, val));
          } else {
            args.push(exp);
          }
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

  getArgumentValue() {
    if (this._source[this._index] === '"') {
      let close = this._source.indexOf('"', this._index + 1);
      var value = this._source.substring(this._index + 1, close);
      let string = new AST.String(value, [value]);
      this._index = close + 1;
      return string;
    } else if (this._source[this._index] === '$') {
      return this.getVariable();
    }

    let cc = this._source.charCodeAt(this._index);

    if (cc >= 48 && cc <= 57) {
      return this.getNumber();
    }
  }

  getNumber() {
    let num = this._source[this._index++];
    let cc = this._source.charCodeAt(this._index);
    while (cc >= 48 && cc <= 57) {
      num += this._source[this._index++];
      cc = this._source.charCodeAt(this._index);
    }

    return new AST.Number(parseInt(num));
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

  getMemberExpression() {
    const exp = this.getVariable();

    if (this._source[this._index] !== '[') {
      return exp;
    }
    const keyword = this.getKeyword();
    return new AST.MemberExpression(exp, keyword);
  }

  getSelector() {
    return this.getCallExpression();
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
