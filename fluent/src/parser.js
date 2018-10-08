const MAX_PLACEABLES = 100;

const RE_UNICODE_ESCAPE = /^[a-fA-F0-9]{4}$/;

const RE_MESSAGE_START = /^(-?[a-zA-Z][a-zA-Z0-9_-]*) *= */mg;
const RE_ATTRIBUTE_START = /\.([a-zA-Z][a-zA-Z0-9_-]*) *= */y;
const RE_VARIANT_START = /\*?\[.*?] */y;

const RE_TEXT_ELEMENT = /([^\\{\n\r]+)/y;

const RE_BLANK = /\s+/y;

const RE_IDENTIFIER = /(-?[a-zA-Z][a-zA-Z0-9_-]*)/y;
const RE_NUMBER_LITERAL = /(-?[0-9]+(\.[0-9]+)?)/y;
const RE_STRING_LITERAL = /"(.*?)"/y;

/**
 * The `Parser` class is responsible for parsing FTL resources.
 *
 * This parser is optimized for runtime performance. There is an equivalent of
 * this parser in syntax/parser which is generating full AST which is useful
 * for FTL tools.
 */
export default class RuntimeParser {
  /**
   * Parse FTL code into entries formattable by the FluentBundle.
   *
   * Given a string of FTL syntax, return an iterator over entries which can be
   * consumed by the FluentResource constructor.
   *
   * @param {String} string
   * @returns {Iterator} entries
   */
  *entries(string) {
    this.source = string;
    this.cursor = 0;
    this.length = string.length;

    RE_MESSAGE_START.lastIndex = 0;
    while (true) {
      let next = RE_MESSAGE_START.exec(this.source);
      if (next === null) {
        break;
      }

      this.cursor = RE_MESSAGE_START.lastIndex;
      try {
        yield [next[1], this.getMessage()];
      } catch (e) {
        console.error(e);
        continue;
      }
    }
  }

  test(re) {
    re.lastIndex = this.cursor;
    return re.test(this.source);
  }

  skip(re) {
    if (this.test(re)) {
      this.cursor = re.lastIndex;
    }
  }

  match(re) {
    re.lastIndex = this.cursor;
    let result = re.exec(this.source);

    if (result === null) {
      this.cursor += 1;
      throw new SyntaxError();
    }

    this.cursor = re.lastIndex;
    return result[1];
  }

  /**
   * Parse the source string from the current index as an FTL message
   * and add it to the entries property on the Parser.
   *
   * @private
   */
  getMessage() {
    let value = this.getPattern();
    let attrs = this.getAttributes();
    return {value, attrs};
  }

  /**
   * Skip multiline whitespace. Return true if it was indented.
   *
   * @private
   */
  skipIndent() {
    let start = this.cursor;
    this.skip(RE_BLANK);

    switch (this.source[this.cursor]) {
      case ".":
      case "[":
      case "*":
      case "}":
        return false;
      case "{":
        return this.source.slice(start, this.cursor);
    }
    switch (this.source[this.cursor - 1]) {
      case " ":
        return this.source.slice(start, this.cursor);
      default:
        return false;
    }
  }

  getPattern() {
    if (this.test(RE_TEXT_ELEMENT)) {
      var first = this.match(RE_TEXT_ELEMENT);
    }

    if (this.source[this.cursor] === "{") {
      return first
        ? this.getPatternElements(first)
        : this.getPatternElements();
    }

    let block = this.skipIndent();
    if (block) {
      return first
        ? this.getPatternElements(first, block)
        : this.getPatternElements(block);
    }

    return first;
  }

  getPatternElements(...elements) {
    let placeableCount = 0;

    while (true) {
      if (this.test(RE_TEXT_ELEMENT)) {
        let element = this.match(RE_TEXT_ELEMENT);
        elements.push(element);
        continue;
      }

      if (this.source[this.cursor] === "{") {
        let element = this.getPlaceable();
        elements.push(element);
        placeableCount++;
        if (placeableCount > MAX_PLACEABLES) {
          throw new SyntaxError();
        }
        this.cursor++;
        continue;
      }

      let block = this.skipIndent();
      if (block) {
        elements.push(block.replace(/ /g, ""));
        continue;
      }

      // TODO Escapes
      // TODO Normalize leading and trailing whitespace

      break;
    }

    return elements;
  }

  /**
   * Parse an escape sequence and return the unescaped character.
   *
   * @returns {string}
   * @private
   */
  getEscapedCharacter(specials = ["{", "\\"]) {
    this.cursor++;
    const next = this.source[this.cursor];

    if (specials.includes(next)) {
      this.cursor++;
      return next;
    }

    if (next === "u") {
      const sequence = this.source.slice(this.cursor + 1, this.cursor + 5);
      if (RE_UNICODE_ESCAPE.test(sequence)) {
        this.cursor += 5;
        return String.fromCodePoint(parseInt(sequence, 16));
      }

      throw this.error(`Invalid Unicode escape sequence: \\u${sequence}`);
    }

    throw this.error(`Unknown escape sequence: \\${next}`);
  }

  /**
   * Parses a single placeable in a Message pattern and returns its
   * expression.
   *
   * @returns {Object}
   * @private
   */
  getPlaceable() {
    this.cursor++;

    const onlyVariants = this.getVariants();
    if (onlyVariants) {
      return {type: "select", selector: null, ...onlyVariants};
    }

    const selector = this.getInlineExpression();

    this.skip(RE_BLANK);

    const ch = this.source[this.cursor];

    if (ch === "}") {
      return selector;
    }

    this.cursor += 2; // ->
    return {
      type: "select",
      selector,
      ...this.getVariants()
    };
  }

  /**
   * Parses an inline expression.
   *
   * @returns {Object}
   * @private
   */
  getInlineExpression() {
    if (this.source[this.cursor] === "{") {
      return this.getPlaceable();
    }

    const literal = this.getLiteral();

    if (literal.type !== "ref") {
      return literal;
    }

    if (this.source[this.cursor] === ".") {
      this.cursor++;
      const name = this.match(RE_IDENTIFIER);
      return {
        type: "getattr",
        id: literal,
        name
      };
    }

    if (this.source[this.cursor] === "[") {
      this.cursor++;
      const key = this.getVariantKey();
      this.cursor++;
      return {
        type: "getvar",
        id: literal,
        key
      };
    }

    if (this.source[this.cursor] === "(") {
      this.cursor++;
      const args = this.getCallArgs();
      this.cursor++;
      return {
        type: "call",
        fun: {...literal, type: "fun"},
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

    while (this.cursor < this.length) {
      this.skip(RE_BLANK);

      if (this.source[this.cursor] === ")") {
        return args;
      }

      const exp = this.getInlineExpression();

      // MessageReference in this place may be an entity reference, like:
      // `call(foo)`, or, if it's followed by `:` it will be a key-value pair.
      if (exp.type === "ref") {
        this.skip(RE_BLANK);

        if (this.source[this.cursor] === ":") {
          this.cursor++;
          this.skip(RE_BLANK);

          args.push({
            type: "narg",
            name: exp.name,
            value: this.getInlineExpression(),
          });

        } else {
          args.push(exp);
        }
      } else {
        args.push(exp);
      }

      this.skip(RE_BLANK);

      if (this.source[this.cursor] === ")") {
        break;
      } else if (this.source[this.cursor] === ",") {
        this.cursor++;
      } else {
        throw new SyntaxError();
      }
    }

    return args;
  }

  /**
   * Parses a list of Message attributes.
   *
   * @returns {Object?}
   * @private
   */
  getAttributes() {
    let attrs = {};
    let hasAttributes = false;

    while (true) {
      this.skip(RE_BLANK);
      if (!this.test(RE_ATTRIBUTE_START)) {
        break;
      } else if (!hasAttributes) {
        hasAttributes = true;
      }

      let key = this.match(RE_ATTRIBUTE_START);
      let value = this.getPattern();

      if (typeof value === "string") {
        attrs[key] = value;
      } else {
        attrs[key] = {
          value
        };
      }
    }

    return hasAttributes ? attrs : null;
  }

  /**
   * Parses a list of variants.
   *
   * @returns {Object?}
   * @private
   */
  getVariants() {
    const vars = [];
    let index = 0;
    let def;

    while (this.cursor < this.length) {
      this.skip(RE_BLANK);
      if (!this.test(RE_VARIANT_START)) {
        break;
      }

      if (this.source[this.cursor] === "*") {
        this.cursor += 2;
        def = index;
      } else {
        this.cursor++
      }

      const key = this.getVariantKey();
      this.cursor = RE_VARIANT_START.lastIndex;
      const value = this.getPattern();
      vars[index++] = {key, value};
    }

    return index > 0 ? {vars, def} : null;
  }

  /**
   * Parses a Variant key.
   *
   * @returns {String}
   * @private
   */
  getVariantKey() {
    this.skip(RE_BLANK);
    let key = this.test(RE_NUMBER_LITERAL)
      ? this.getNumber()
      : this.match(RE_IDENTIFIER);
    this.skip(RE_BLANK);
    return key;
  }

  /**
   * Parses an FTL Number.
   *
   * @returns {Object}
   * @private
   */
  getNumber() {
    return {
      type: "num",
      value: this.match(RE_NUMBER_LITERAL),
    };
  }


  /**
   * Parses an FTL literal.
   *
   * @returns {Object}
   * @private
   */
  getLiteral() {
    if (this.source[this.cursor] === "$") {
      this.cursor++;
      return {
        type: "var",
        name: this.match(RE_IDENTIFIER)
      };
    }

    if (this.test(RE_IDENTIFIER)) {
      return {
        type: "ref",
        name: this.match(RE_IDENTIFIER)
      };
    }

    if (this.test(RE_NUMBER_LITERAL)) {
      return this.getNumber();
    }

    if (this.test(RE_STRING_LITERAL)) {
      return this.match(RE_STRING_LITERAL);
    }

    throw new SyntaxError();
  }
}
