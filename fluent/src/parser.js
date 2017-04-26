/*  eslint no-magic-numbers: [0]  */

const MAX_PLACEABLES = 100;

/**
 * The `Parser` class is responsible for parsing FTL resources.
 *
 * It's only public method is `getResource(source)` which takes an FTL string
 * and returns a two element Array with an Object of entries generated from the
 * source as the first element and an array of SyntaxError objects as the
 * second.
 *
 * This parser is optimized for runtime performance.
 *
 * There is an equivalent of this parser in syntax/parser which is
 * generating full AST which is useful for FTL tools.
 */
class RuntimeParser {
  /**
   * @param {string} string
   * @returns {Array<Object, Array>}
   */
  getResource(string) {
    this._source = string;
    this._index = 0;
    this._length = string.length;

    const entries = {};
    const errors = [];

    this.getWS();
    while (this._index < this._length) {
      try {
        this.getEntry(entries);
      } catch (e) {
        if (e instanceof SyntaxError) {
          errors.push(e);

          const nextEntity = this._findNextEntryStart();
          this._index = nextEntity === -1
            ? this._length
            : nextEntity;
        } else {
          throw e;
        }
      }
      this.getWS();
    }

    return [entries, errors];
  }

  getEntry(entries) {
    // The pointer here should either be at the beginning of the file
    // or right after new line.
    if (this._index !== 0 &&
        this._source[this._index - 1] !== '\n') {
      throw this.error('Expected new line and a new entry');
    }

    const ch = this._source[this._index];

    // We don't care about comments or sections at runtime
    if (ch === '/') {
      this.getComment();
      return;
    }

    if (ch === '[') {
      this.getSection();
      return;
    }

    if (ch !== '\n') {
      this.getMessage(entries);
    }
  }

  getSection() {
    this._index += 1;
    if (this._source[this._index] !== '[') {
      throw this.error('Expected "[[" to open a section');
    }

    this._index += 1;

    this.getLineWS();
    this.getSymbol();
    this.getLineWS();

    if (this._source[this._index] !== ']' ||
        this._source[this._index + 1] !== ']') {
      throw this.error('Expected "]]" to close a section');
    }

    this._index += 2;

    // sections are ignored in the runtime ast
    return undefined;
  }

  getMessage(entries) {
    const id = this.getIdentifier();
    let attrs = null;
    let tags = null;

    this.getLineWS();

    let ch = this._source[this._index];

    let val;

    if (ch === '=') {
      this._index++;

      this.getLineWS();

      val = this.getPattern();
    } else {
      this.getWS();
    }

    ch = this._source[this._index];

    if (ch === '\n') {
      this._index++;
      this.getLineWS();
      ch = this._source[this._index];
    }

    if (ch === '.') {
      attrs = this.getAttributes();
    }

    if (ch === '#') {
      if (attrs !== null) {
        throw this.error('Tags cannot be added to a message with attributes.');
      }
      tags = this.getTags();
    }

    if (tags === null && attrs === null && typeof val === 'string') {
      entries[id] = val;
    } else {
      if (val === undefined) {
        if (tags === null && attrs === null) {
          throw this.error(`Expected a value (like: " = value") or
            an attribute (like: ".key = value")`);
        }
      }

      entries[id] = { val };
      if (attrs) {
        entries[id].attrs = attrs;
      }
      if (tags) {
        entries[id].tags = tags;
      }
    }
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
      throw this.error('Expected an identifier (starting with [a-zA-Z_])');
    }

    while ((cc >= 97 && cc <= 122) || // a-z
           (cc >= 65 && cc <= 90) ||  // A-Z
           (cc >= 48 && cc <= 57) ||  // 0-9
           cc === 95 || cc === 45) {  // _-
      cc = this._source.charCodeAt(++this._index);
    }

    return this._source.slice(start, this._index);
  }

  getSymbol() {
    let name = '';

    const start = this._index;
    let cc = this._source.charCodeAt(this._index);

    if ((cc >= 97 && cc <= 122) || // a-z
        (cc >= 65 && cc <= 90) ||  // A-Z
        cc === 95 || cc === 32) {  //  _
      cc = this._source.charCodeAt(++this._index);
    } else if (name.length === 0) {
      throw this.error('Expected a keyword (starting with [a-zA-Z_])');
    }

    while ((cc >= 97 && cc <= 122) || // a-z
           (cc >= 65 && cc <= 90) ||  // A-Z
           (cc >= 48 && cc <= 57) ||  // 0-9
           cc === 95 || cc === 45 || cc === 32) {  //  _-
      cc = this._source.charCodeAt(++this._index);
    }

    // If we encountered the end of name, we want to test is the last
    // collected character is a space.
    // If it is, we will backtrack to the last non-space character because
    // the keyword cannot end with a space character.
    while (this._source.charCodeAt(this._index - 1) === 32) {
      this._index--;
    }

    name += this._source.slice(start, this._index);

    return { type: 'sym', name };
  }

  getString() {
    let value = '';

    while (++this._index < this._length) {
      const ch = this._source[this._index];

      if (ch === '"') {
        break;
      }

      if (ch === '\n') {
        break;
      }

      value += ch;
    }

    this._index++;
    return value;
  }

  // We're going to first try to see if the pattern is simple.
  // If it is we can just look for the end of the line and read the string.
  //
  // Then, if either the line contains a placeable opening `{` or the
  // next line starts with a pipe `|`, we switch to complex pattern.
  getPattern() {
    const start = this._index;
    let eol = this._source.indexOf('\n', this._index);

    if (eol === -1) {
      eol = this._length;
    }

    const line = start !== eol ?
      this._source.slice(start, eol) : undefined;

    if (line !== undefined && line.includes('{')) {
      return this.getComplexPattern();
    }

    this._index = eol + 1;

    if (this._source[this._index] === ' ') {
      this._index = start;
      return this.getComplexPattern();
    }

    return line;
  }

  /* eslint-disable complexity */
  getComplexPattern() {
    let buffer = '';
    const content = [];
    let placeables = 0;

    let ch = this._source[this._index];

    // If the string starts with \", \{ or \\ skip the first `\` and add the
    // following character to the buffer without interpreting it.
    if (ch === '\\' &&
      (this._source[this._index + 1] === '"' ||
       this._source[this._index + 1] === '{' ||
       this._source[this._index + 1] === '\\')) {
      buffer += this._source[this._index + 1];
      this._index += 2;
      ch = this._source[this._index];
    }

    while (this._index < this._length) {
      // This block handles multi-line strings combining strings seaprated
      // by new line and `|` character at the beginning of the next one.
      if (ch === '\n') {
        this._index++;
        if (this._source[this._index] !== ' ') {
          break;
        }
        this.getLineWS();

        if (
            this._source[this._index] === '}' ||
            this._source[this._index] === '[' ||
            this._source[this._index] === '*' ||
            this._source[this._index] === '#' ||
            this._source[this._index] === '.'
        ) {
          break;
        }

        if (buffer.length || content.length) {
          buffer += '\n';
        }
        ch = this._source[this._index];
        continue;
      } else if (ch === '\\') {
        const ch2 = this._source[this._index + 1];
        if (ch2 === '"' || ch2 === '{') {
          ch = ch2;
          this._index++;
        }
      } else if (ch === '{') {
        // Push the buffer to content array right before placeable
        if (buffer.length) {
          content.push(buffer);
        }
        if (placeables > MAX_PLACEABLES - 1) {
          throw this.error(
            `Too many placeables, maximum allowed is ${MAX_PLACEABLES}`);
        }
        buffer = '';
        content.push(this.getPlaceable());

        this._index++;

        ch = this._source[this._index];
        placeables++;
        continue;
      }

      if (ch) {
        buffer += ch;
      }
      this._index++;
      ch = this._source[this._index];
    }

    if (content.length === 0) {
      return buffer.length ? buffer : undefined;
    }

    if (buffer.length) {
      content.push(buffer);
    }

    return content;
  }
  /* eslint-enable complexity */

  getPlaceable() {
    const start = ++this._index;

    this.getWS();

    if (this._source[this._index] === '*' ||
       (this._source[this._index] === '[' &&
        this._source[this._index + 1] !== ']')) {
      const variants = this.getVariants();

      return {
        type: 'sel',
        exp: null,
        vars: variants[0],
        def: variants[1]
      };
    }

    // Rewind the index and only support in-line white-space now.
    this._index = start;
    this.getLineWS();

    const selector = this.getSelectorExpression();
    let variants;

    this.getWS();

    const ch = this._source[this._index];

    // If the expression is followed by `->` we're going to collect
    // its members and return it as a select expression.
    if (ch !== '}') {
      if (ch !== '-' || this._source[this._index + 1] !== '>') {
        throw this.error('Expected "}", "," or "->"');
      }

      this._index += 2; // ->

      this.getLineWS();

      if (this._source[this._index] !== '\n') {
        throw this.error('Variants should be listed in a new line');
      }

      this.getWS();

      variants = this.getVariants();

      if (variants[0].length === 0) {
        throw this.error('Expected members for the select expression');
      }
    }

    if (variants === undefined) {
      return selector;
    }
    return {
      type: 'sel',
      exp: selector,
      vars: variants[0],
      def: variants[1]
    };
  }

  getSelectorExpression() {
    const literal = this.getLiteral();

    if (literal.type !== 'ref') {
      return literal;
    }

    if (this._source[this._index] === '.') {
      this._index++;

      const name = this.getIdentifier();
      this._index++;
      return {
        type: 'attr',
        id: literal,
        name
      };
    }

    if (this._source[this._index] === '[') {
      this._index++;

      const key = this.getVariantKey();
      this._index++;
      return {
        type: 'var',
        id: literal,
        key
      };
    }

    if (this._source[this._index] === '(') {
      this._index++;
      const args = this.getCallArgs();

      this._index++;

      literal.type = 'fun';

      return {
        type: 'call',
        fun: literal,
        args
      };
    }

    return literal;
  }

  getCallArgs() {
    const args = [];

    if (this._source[this._index] === ')') {
      return args;
    }

    while (this._index < this._length) {
      this.getLineWS();

      const exp = this.getSelectorExpression();

      // MessageReference in this place may be an entity reference, like:
      // `call(foo)`, or, if it's followed by `:` it will be a key-value pair.
      if (exp.type !== 'ref' ||
         exp.namespace !== undefined) {
        args.push(exp);
      } else {
        this.getLineWS();

        if (this._source[this._index] === ':') {
          this._index++;
          this.getLineWS();

          const val = this.getSelectorExpression();

          // If the expression returned as a value of the argument
          // is not a quote delimited string or number, throw.
          //
          // We don't have to check here if the pattern is quote delimited
          // because that's the only type of string allowed in expressions.
          if (typeof val === 'string' ||
              Array.isArray(val) ||
              val.type === 'num') {
            args.push({
              type: 'narg',
              name: exp.name,
              val
            });
          } else {
            this._index = this._source.lastIndexOf(':', this._index) + 1;
            throw this.error(
              'Expected string in quotes, number.');
          }

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

    // The number literal may start with negative sign `-`.
    if (cc === 45) {
      num += '-';
      cc = this._source.charCodeAt(++this._index);
    }

    // next, we expect at least one digit
    if (cc < 48 || cc > 57) {
      throw this.error(`Unknown literal "${num}"`);
    }

    // followed by potentially more digits
    while (cc >= 48 && cc <= 57) {
      num += this._source[this._index++];
      cc = this._source.charCodeAt(this._index);
    }

    // followed by an optional decimal separator `.`
    if (cc === 46) {
      num += this._source[this._index++];
      cc = this._source.charCodeAt(this._index);

      // followed by at least one digit
      if (cc < 48 || cc > 57) {
        throw this.error(`Unknown literal "${num}"`);
      }

      // and optionally more digits
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

  getAttributes() {
    const attrs = {};

    while (this._index < this._length) {
      const ch = this._source[this._index];

      if (ch !== '.') {
        break;
      }
      this._index++;

      const key = this.getIdentifier();

      this.getLineWS();

      this._index++;

      this.getLineWS();

      const val = this.getPattern();

      if (typeof val === 'string') {
        attrs[key] = val;
      } else {
        attrs[key] = {
          val
        };
      }

      this.getWS();
    }

    return attrs;
  }

  getTags() {
    const tags = [];

    while (this._index < this._length) {
      const ch = this._source[this._index];

      if (ch !== '#') {
        break;
      }
      this._index++;

      const symbol = this.getSymbol();

      tags.push(symbol.name);

      this.getWS();
    }

    return tags;
  }

  getVariants() {
    const variants = [];
    let index = 0;
    let defaultIndex;

    while (this._index < this._length) {
      const ch = this._source[this._index];

      if ((ch !== '[' || this._source[this._index + 1] === '[') &&
          ch !== '*') {
        break;
      }
      if (ch === '*') {
        this._index++;
        defaultIndex = index;
      }

      if (this._source[this._index] !== '[') {
        throw this.error('Expected "["');
      }

      this._index++;

      const key = this.getVariantKey();

      this.getLineWS();

      const variant = {
        key,
        val: this.getPattern()
      };
      variants[index++] = variant;

      this.getWS();
    }

    return [variants, defaultIndex];
  }

  // VariantKey may be a Keyword or Number
  getVariantKey() {
    const cc = this._source.charCodeAt(this._index);
    let literal;

    if ((cc >= 48 && cc <= 57) || cc === 45) {
      literal = this.getNumber();
    } else {
      literal = this.getSymbol();
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
      return this.getString();
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

  // At runtime, we don't care about comments so we just have
  // to parse them properly and skip their content.
  getComment() {
    let eol = this._source.indexOf('\n', this._index);

    while (eol !== -1 &&
      this._source[eol + 1] === '/' && this._source[eol + 2] === '/') {
      this._index = eol + 3;

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

  error(message) {
    return new SyntaxError(message);
  }

  _findNextEntryStart() {
    let start = this._index;

    while (true) {
      if (start === 0 || this._source[start - 1] === '\n') {
        const cc = this._source.charCodeAt(start);

        if ((cc >= 97 && cc <= 122) || // a-z
            (cc >= 65 && cc <= 90) ||  // A-Z
             cc === 95 || cc === 47 || cc === 91) {  // _/[
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

export default function parse(string) {
  const parser = new RuntimeParser();
  return parser.getResource(string);
}
