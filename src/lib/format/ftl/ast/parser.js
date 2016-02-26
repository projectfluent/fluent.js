
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

    // we need to define ranges for identifier chars
    while (cc !== 32 && cc !== 10 &&
           cc !== 9 && cc !== 13 && cc !== 125 && cc !== 93) {
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

    if (ch === '\n') {
      start++;
      ch = this._source.charAt(++this._index);
    }

    while (this._index < this._length) {
      while (ch !== '\n' && ch !== '\\' && ch !== '{') {
        ch = this._source.charAt(++this._index);
      }

      let chunk = this._source.slice(start, this._index);
      source += chunk;
      content.push(chunk);

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

  getHash() {
    const hash = [];

    while (this._index < this._length) {
      let key = this.getKeyword();
      let value = this.getValue();

      let hashItem = new AST.HashItem(key, value);

      hash.push(hashItem);
    }

    return new AST.Hash(hash);
  }

  getPlaceable() {
    this._index++;
    this.getWS();
    let id = this.getIdentifier();
    this.getWS();
    
    if (this._source.charAt(this._index) !== '}') {
      throw new Error('Expected "}"');
    }
    this._index++;
    return new AST.Placeable(id);
  }

  getKeyword() {
    this._index++;
    let id = this.getIdentifier();
    this._index++;
    return id;
  }
}

export default {
  parseResource: function(string, pos = false) {
    const parseContext = new ParseContext(string, pos);
    return parseContext.getResource();
  },
};
