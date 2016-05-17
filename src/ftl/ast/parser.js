/*eslint no-magic-numbers: [0]*/

import AST from './ast';
import { L10nError } from '../../lib/errors';

const MAX_PLACEABLES = 100;


class ParseContext {
  constructor(string) {
    this._source = string;
    this._index = 0;
    this._length = string.length;

    this._lastGoodEntryEnd = 0;
  }

  _isIdentifierStart(cc) {
    return ((cc >= 97 && cc <= 122) || // a-z
            (cc >= 65 && cc <= 90) ||  // A-Z
             cc === 95);               // _
  }

  getResource() {
    const resource = new AST.Resource();
    const errors = [];
    let comment = null;

    let section = resource.body;

    if (this._source[this._index] === '#') {
      comment = this.getComment();

      const cc = this._source.charCodeAt(this._index);
      if (!this._isIdentifierStart(cc)) {
        resource.comment = comment;
        comment = null;
      }
    }

    this.getWS();
    while (this._index < this._length) {
      try {
        const entry = this.getEntry(comment);
        if (entry.type === 'Section') {
          resource.body.push(entry);
          section = entry.body;
        } else {
          section.push(entry);
        }
        this._lastGoodEntryEnd = this._index;
        comment = null;
      } catch (e) {
        if (e instanceof L10nError) {
          errors.push(e);
          section.push(this.getJunkEntry());
        } else {
          throw e;
        }
      }
      this.getWS();
    }

    return [resource, errors];
  }

  getEntry(comment = null) {
    if (this._index !== 0 &&
        this._source[this._index - 1] !== '\n') {
      throw this.error('Expected new line and a new entry');
    }

    if (comment === null && this._source[this._index] === '#') {
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
  }

  getSection(comment = null) {
    this._index += 1;
    if (this._source[this._index] !== '[') {
      throw this.error('Expected "[[" to open a section');
    }

    this._index += 1;

    this.getLineWS();

    const key = this.getKeyword();

    this.getLineWS();

    if (this._source[this._index] !== ']' ||
        this._source[this._index + 1] !== ']') {
      throw this.error('Expected "]]" to close a section');
    }

    this._index += 2;

    return new AST.Section(key, [], comment);
  }

  getEntity(comment = null) {
    const id = this.getIdentifier();

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

    return new AST.Entity(id, value, members, comment);
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

    if (this._isIdentifierStart(cc)) {
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

    return new AST.Identifier(name);
  }

  getKeyword() {
    let name = '';
    let namespace = this.getIdentifier().name;

    if (this._source[this._index] === '/') {
      this._index++;
    } else if (namespace) {
      name = namespace;
      namespace = null;
    }

    const start = this._index;
    let cc = this._source.charCodeAt(this._index);

    if (this._isIdentifierStart(cc)) {
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

    return new AST.Keyword(name, namespace);
  }

  getPattern() {
    let buffer = '';
    let source = '';
    const content = [];
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
        const ch2 = this._source[this._index + 1];
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
          content.push(new AST.TextElement(buffer));
        }
        source += buffer;
        buffer = ''
        const start = this._index;
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
      content.push(new AST.TextElement(buffer));
    }

    if (content.length === 0) {
      if (quoteDelimited !== null) {
        content.push(new AST.TextElement(source));
      } else {
        return null;
      }
    }

    const pattern = new AST.Pattern(source, content);
    pattern._quoteDelim = quoteDelimited !== null;
    return pattern;
  }

  getPlaceable() {
    this._index++;

    const expressions = [];

    this.getLineWS();

    while (this._index < this._length) {
      const start = this._index;
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

    return new AST.Placeable(expressions);
  }

  getPlaceableExpression() {
    const selector = this.getCallExpression();
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
    return new AST.SelectExpression(selector, members);
  }

  getCallExpression() {
    let exp = this.getMemberExpression();

    if (this._source[this._index] !== '(') {
      return exp;
    }

    this._index++;

    const args = this.getCallArgs();

    this._index++;

    if (exp instanceof AST.EntityReference) {
      exp = new AST.MacroReference(exp.name);
    }

    return new AST.CallExpression(exp, args);
  }

  getCallArgs() {
    const args = [];

    if (this._source[this._index] === ')') {
      return args;
    }

    while (this._index < this._length) {
      this.getLineWS();

      const exp = this.getCallExpression();

      if (!(exp instanceof AST.EntityReference)) {
        args.push(exp);
      } else {
        this.getLineWS();

        if (this._source[this._index] === ':') {
          this._index++;
          this.getLineWS();

          const val = this.getCallExpression();

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

    return new AST.Number(num);
  }

  getMemberExpression() {
    let exp = this.getLiteral();

    while (this._source[this._index] === '[') {
      const keyword = this.getMemberKey();
      exp = new AST.MemberExpression(exp, keyword);
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

      const key = this.getMemberKey();

      this.getLineWS();

      const value = this.getPattern();

      const member = new AST.Member(key, value, def);

      members.push(member);

      this.getWS();
    }

    return members;
  }

  getMemberKey() {
    this._index++;

    const cc = this._source.charCodeAt(this._index);
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
    const cc = this._source.charCodeAt(this._index);
    if ((cc >= 48 && cc <= 57) || cc === 45) {
      return this.getNumber();
    } else if (cc === 34) { // "
      return this.getPattern();
    } else if (cc === 36) { // $
      this._index++;
      const name = this.getIdentifier().name;
      return new AST.ExternalArgument(name);
    }

    const name = this.getIdentifier().name;
    return new AST.EntityReference(name);
  }

  getComment() {
    this._index++;
    if (this._source[this._index] === ' ') {
      this._index++;
    }

    let content = '';

    let eol = this._source.indexOf('\n', this._index);

    content += this._source.substring(this._index, eol);

    while (eol !== -1 && this._source[eol + 1] === '#') {
      this._index = eol + 2;

      if (this._source[this._index] === ' ') {
        this._index++;
      }

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
    const pos = this._index;

    if (start === null) {
      start = pos;
    }
    start = this._findEntityStart(start);

    const context = this._source.slice(start, pos + 10);

    const msg = '\n\n  ' + message +
      '\nat pos ' + pos + ':\n------\n…' + context + '\n------';
    const err = new L10nError(msg);

    const row = this._source.slice(0, pos).split('\n').length;
    const col = pos - this._source.lastIndexOf('\n', pos - 1);
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

    const junk = new AST.JunkEntry(
      this._source.slice(entityStart, nextEntity));
    return junk;
  }

  _findEntityStart(pos) {
    let start = pos;

    while (true) {
      start = this._source.lastIndexOf('\n', start - 2);
      if (start === -1 || start === 0) {
        start = 0;
        break;
      }
      const cc = this._source.charCodeAt(start + 1);

      if (this._isIdentifierStart(cc)) {
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
        const cc = this._source.charCodeAt(start);

        if (this._isIdentifierStart(cc) || cc === 35 || cc === 91) {
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
