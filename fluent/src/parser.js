/*  eslint no-magic-numbers: [0]  */

const MAX_PLACEABLES = 100;

const identifierRe = new RegExp('[a-zA-Z_][a-zA-Z0-9_-]*', 'y');

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
   * Parse FTL code into entries formattable by the MessageContext.
   *
   * Given a string of FTL syntax, return a map of entries that can be passed
   * to MessageContext.format and a list of errors encountered during parsing.
   *
   * @param {String} string
   * @returns {Array<Object, Array>}
   */
  getResource(string) {
    this._source = string;
    this._index = 0;
    this._length = string.length;
    this.entries = {};

    const errors = [];

    this.skipWS();
    while (this._index < this._length) {
      try {
        this.getEntry();
      } catch (e) {
        if (e instanceof SyntaxError) {
          errors.push(e);

          this.skipToNextEntryStart();
        } else {
          throw e;
        }
      }
      this.skipWS();
    }

    return [this.entries, errors];
  }

  /**
   * Parse the source string from the current index as an FTL entry
   * and add it to object's entries property.
   *
   * @private
   */
  getEntry() {
    // The index here should either be at the beginning of the file
    // or right after new line.
    if (this._index !== 0 &&
        this._source[this._index - 1] !== '\n') {
      throw this.error(`Expected an entry to start
        at the beginning of the file or on a new line.`);
    }

    const ch = this._source[this._index];

    // We don't care about comments or sections at runtime
    if (ch === '/') {
      this.skipComment();
      return;
    }

    if (ch === '[') {
      this.skipSection();
      return;
    }

    this.getMessage();
  }

  /**
   * Skip the section entry from the current index.
   *
   * @private
   */
  skipSection() {
    this._index += 1;
    if (this._source[this._index] !== '[') {
      throw this.error('Expected "[[" to open a section');
    }

    this._index += 1;

    this.skipInlineWS();
    this.getSymbol();
    this.skipInlineWS();

    if (this._source[this._index] !== ']' ||
        this._source[this._index + 1] !== ']') {
      throw this.error('Expected "]]" to close a section');
    }

    this._index += 2;
  }

  /**
   * Parse the source string from the current index as an FTL message
   * and add it to the entries property on the Parser.
   *
   * @private
   */
  getMessage() {
    const id = this.getIdentifier();
    let attrs = null;
    let tags = null;

    this.skipInlineWS();

    let ch = this._source[this._index];

    let val;

    if (ch === '=') {
      this._index++;

      this.skipInlineWS();
      this.skipBlankLines();
      this.skipInlineWS();

      val = this.getPattern();
    } else {
      this.skipWS();
    }

    ch = this._source[this._index];

    if (ch === '\n') {
      this._index++;
      this.skipBlankLines();
      this.skipInlineWS();
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
      this.entries[id] = val;
    } else {
      if (val === undefined) {
        if (tags === null && attrs === null) {
          throw this.error(`Expected a value (like: " = value") or
            an attribute (like: ".key = value")`);
        }
      }

      this.entries[id] = { val };
      if (attrs) {
        this.entries[id].attrs = attrs;
      }
      if (tags) {
        this.entries[id].tags = tags;
      }
    }
  }

  /**
   * Skip whitespace.
   *
   * @private
   */
  skipWS() {
    let ch = this._source[this._index];
    while (ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r') {
      ch = this._source[++this._index];
    }
  }

  /**
   * Skip inline whitespace (space and \t).
   *
   * @private
   */
  skipInlineWS() {
    let ch = this._source[this._index];
    while (ch === ' ' || ch === '\t') {
      ch = this._source[++this._index];
    }
  }

  /**
   * Skip blank lines.
   *
   * @private
   */
  skipBlankLines() {
    while (true) {
      let ptr = this._index;

      this.skipInlineWS();

      if (this._source[ptr] === '\n') {
        this._index += 1;
      } else {
        this._index = ptr;
        break;
      }
    }
  }

  /**
   * Get Message identifier.
   *
   * @returns {String}
   * @private
   */
  getIdentifier() {
    identifierRe.lastIndex = this._index;

    const result = identifierRe.exec(this._source);

    if (result === null) {
      this._index += 1;
      throw this.error('Expected an identifier (starting with [a-zA-Z_])');
    }

    this._index = identifierRe.lastIndex;
    return result[0];
  }

  /**
   * Get Symbol.
   *
   * @returns {Object}
   * @private
   */
  getSymbol() {
    let name = '';

    const start = this._index;
    let cc = this._source.charCodeAt(this._index);

    if ((cc >= 97 && cc <= 122) || // a-z
        (cc >= 65 && cc <= 90) ||  // A-Z
        cc === 95 || cc === 32) {  // _ <space>
      cc = this._source.charCodeAt(++this._index);
    } else {
      throw this.error('Expected a keyword (starting with [a-zA-Z_])');
    }

    while ((cc >= 97 && cc <= 122) || // a-z
           (cc >= 65 && cc <= 90) ||  // A-Z
           (cc >= 48 && cc <= 57) ||  // 0-9
           cc === 95 || cc === 45 || cc === 32) {  // _- <space>
      cc = this._source.charCodeAt(++this._index);
    }

    // If we encountered the end of name, we want to test if the last
    // collected character is a space.
    // If it is, we will backtrack to the last non-space character because
    // the keyword cannot end with a space character.
    while (this._source.charCodeAt(this._index - 1) === 32) {
      this._index--;
    }

    name += this._source.slice(start, this._index);

    return { type: 'sym', name };
  }

  /**
   * Get simple string argument enclosed in `"`.
   *
   * @returns {String}
   * @private
   */
  getString() {
    const start = this._index + 1;

    while (++this._index < this._length) {
      const ch = this._source[this._index];

      if (ch === '"') {
        break;
      }

      if (ch === '\n') {
        break;
      }
    }

    return this._source.substring(start, this._index++);
  }

  /**
   * Parses a Message pattern.
   * Message Pattern may be a simple string or an array of strings
   * and placeable expressions.
   *
   * @returns {String|Array}
   * @private
   */
  getPattern() {
    // We're going to first try to see if the pattern is simple.
    // If it is we can just look for the end of the line and read the string.
    //
    // Then, if either the line contains a placeable opening `{` or the
    // next line starts an indentation, we switch to complex pattern.
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

  /**
   * Parses a complex Message pattern.
   * This function is called by getPattern when the message is multiline,
   * or contains escape chars or placeables.
   * It does full parsing of complex patterns.
   *
   * @returns {Array}
   * @private
   */
  /* eslint-disable complexity */
  getComplexPattern() {
    let buffer = '';
    const content = [];
    let placeables = 0;

    let ch = this._source[this._index];

    while (this._index < this._length) {
      // This block handles multi-line strings combining strings separated
      // by new line and `|` character at the beginning of the next one.
      if (ch === '\n') {
        this._index++;

        // We want to capture the start and end pointers
        // around blank lines and add them to the buffer
        // but only if the blank lines are in the middle
        // of the string.
        let ptr = this._index;
        this.skipBlankLines();
        let ptr2 = this._index;


        if (this._source[this._index] !== ' ') {
          break;
        }
        this.skipInlineWS();

        if (this._source[this._index] === '}' ||
            this._source[this._index] === '[' ||
            this._source[this._index] === '*' ||
            this._source[this._index] === '#' ||
            this._source[this._index] === '.') {
          break;
        }

        buffer += this._source.substring(ptr, ptr2);

        if (buffer.length || content.length) {
          buffer += '\n';
        }
        ch = this._source[this._index];
        continue;
      } else if (ch === '\\') {
        const ch2 = this._source[this._index + 1];
        if (ch2 === '"' || ch2 === '{' || ch2 === '\\') {
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

  /**
   * Parses a single placeable in a Message pattern and returns its
   * expression.
   *
   * @returns {Object}
   * @private
   */
  getPlaceable() {
    const start = ++this._index;

    this.skipWS();

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
    this.skipInlineWS();

    const selector = this.getSelectorExpression();

    this.skipWS();

    const ch = this._source[this._index];

    if (ch === '}') {
      return selector;
    }

    if (ch !== '-' || this._source[this._index + 1] !== '>') {
      throw this.error('Expected "}" or "->"');
    }

    this._index += 2; // ->

    this.skipInlineWS();

    if (this._source[this._index] !== '\n') {
      throw this.error('Variants should be listed in a new line');
    }

    this.skipWS();

    const variants = this.getVariants();

    if (variants[0].length === 0) {
      throw this.error('Expected members for the select expression');
    }

    return {
      type: 'sel',
      exp: selector,
      vars: variants[0],
      def: variants[1]
    };
  }

  /**
   * Parses a selector expression.
   *
   * @returns {Object}
   * @private
   */
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

  /**
   * Parses call arguments for a CallExpression.
   *
   * @returns {Array}
   * @private
   */
  getCallArgs() {
    const args = [];

    if (this._source[this._index] === ')') {
      return args;
    }

    while (this._index < this._length) {
      this.skipInlineWS();

      const exp = this.getSelectorExpression();

      // MessageReference in this place may be an entity reference, like:
      // `call(foo)`, or, if it's followed by `:` it will be a key-value pair.
      if (exp.type !== 'ref' ||
         exp.namespace !== undefined) {
        args.push(exp);
      } else {
        this.skipInlineWS();

        if (this._source[this._index] === ':') {
          this._index++;
          this.skipInlineWS();

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

      this.skipInlineWS();

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

  /**
   * Parses an FTL Number.
   *
   * @returns {Object}
   * @private
   */
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

  /**
   * Parses a list of Message attributes.
   *
   * @returns {Object}
   * @private
   */
  getAttributes() {
    const attrs = {};

    while (this._index < this._length) {
      const ch = this._source[this._index];

      if (ch !== '.') {
        break;
      }
      this._index++;

      const key = this.getIdentifier();

      this.skipInlineWS();

      if (this._source[this._index] !== '=') {
        throw this.error('Expected "="');
      }
      this._index++;

      this.skipInlineWS();

      const val = this.getPattern();

      if (typeof val === 'string') {
        attrs[key] = val;
      } else {
        attrs[key] = {
          val
        };
      }

      this.skipWS();
    }

    return attrs;
  }

  /**
   * Parses a list of Message tags.
   *
   * @returns {Array}
   * @private
   */
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

      this.skipWS();
    }

    return tags;
  }

  /**
   * Parses a list of Selector variants.
   *
   * @returns {Array}
   * @private
   */
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

      this.skipInlineWS();

      const variant = {
        key,
        val: this.getPattern()
      };
      variants[index++] = variant;

      this.skipWS();
    }

    return [variants, defaultIndex];
  }

  /**
   * Parses a Variant key.
   *
   * @returns {String}
   * @private
   */
  getVariantKey() {
    // VariantKey may be a Keyword or Number

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

  /**
   * Parses an FTL literal.
   *
   * @returns {Object}
   * @private
   */
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

  /**
   * Skips an FTL comment.
   *
   * @private
   */
  skipComment() {
    // At runtime, we don't care about comments so we just have
    // to parse them properly and skip their content.
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

  /**
   * Creates a new SyntaxError object with a given message.
   *
   * @param {String} message
   * @returns {Object}
   * @private
   */
  error(message) {
    return new SyntaxError(message);
  }

  /**
   * Skips to the beginning of a next entry after the current position.
   * This is used to mark the boundary of junk entry in case of error,
   * and recover from the returned position.
   *
   * @private
   */
  skipToNextEntryStart() {
    let start = this._index;

    while (true) {
      if (start === 0 || this._source[start - 1] === '\n') {
        const cc = this._source.charCodeAt(start);

        if ((cc >= 97 && cc <= 122) || // a-z
            (cc >= 65 && cc <= 90) ||  // A-Z
             cc === 95 || cc === 47 || cc === 91) {  // _/[
          this._index = start;
          return;
        }
      }

      start = this._source.indexOf('\n', start);

      if (start === -1) {
        this._index = this._length;
        return;
      }
      start++;
    }
  }
}

/**
 * Parses an FTL string using RuntimeParser and returns the generated
 * object with entries and a list of errors.
 *
 * @param {String} string
 * @returns {Array<Object, Array>}
 */
export default function parse(string) {
  const parser = new RuntimeParser();
  return parser.getResource(string);
}
