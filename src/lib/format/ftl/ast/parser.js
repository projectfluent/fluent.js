
import AST from './ast';
import { L10nError } from '../../../errors';

const MAX_PLACEABLES = 100;


class ParseContext {
  constructor(string, pos) {
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

    this.getWS();

    if (this._source.charAt(this._index++) !== '=') {
      throw new Error();
    }

    this.getWS();
    
    const value = this.getValue();

    const entity = new AST.Entity(id, value);
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

    while (cc !== 32) {
      cc = this._source.charCodeAt(++this._index);
    }

    return new AST.Identifier(this._source.slice(start, this._index));
  }

  getValue() {
    return this.getString();
  }

  getString() {
    let start = this._index;
    let string = '';

    let cc = this._source.charCodeAt(this._index);

    if (cc === 124) {
      start++;
      cc = this._source.charCodeAt(++this._index);
    }

    if (cc === 32) {
      start++;
      cc = this._source.charCodeAt(++this._index);
    }


    while (this._index < this._length) {
      while (cc !== 10) {
        cc = this._source.charCodeAt(++this._index);
      }

      string += this._source.slice(start, this._index).trimRight();

      this.getWS();

      let cc = this._source.charCodeAt(this._index);

      if (cc === 124) {
        this._index++;
        start = this._index;
        string += '\n';

        cc = this._source.charCodeAt(this._index);

        if (cc === 32) {
          start++;
          this._index++;
          cc = this._source.charCodeAt(this._index);
        }
      } else {
        break;
      }
    }

    return new AST.String(string);
  }
}

export default {
  parseResource: function(string, pos = false) {
    const parseContext = new ParseContext(string, pos);
    return parseContext.getResource();
  },
};
