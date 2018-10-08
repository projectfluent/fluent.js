/*  eslint no-magic-numbers: [0]  */

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
 * It's only public method is `getResource(source)` which takes an FTL string
 * and returns an Object of entries parsed from the source.
 *
 * This parser is optimized for runtime performance.
 *
 * There is an equivalent of this parser in syntax/parser which is
 * generating full AST which is useful for FTL tools.
 */
class RuntimeParser {
  /**
   * Parse FTL code into entries formattable by the FluentBundle.
   *
   * Given a string of FTL syntax, return a map of entries that can be passed
   * to FluentBundle.format and a list of errors encountered during parsing.
   *
   * @param {String} string
   * @returns {Array<Object, Array>}
   */
  getResource(string) {
    this._source = string;
    this._index = 0;
    this._length = string.length;

    const entries = [];

    for (const offset of this.entryOffsets(string)) {
      this._index = offset;
      try {
        entries.push(this.getMessage());
      } catch (e) {
        console.error(e);
        continue;
      }
    }

    return entries;
  }

  *entryOffsets(source) {
    let lastIndex = 0;
    while (true) {
      RE_MESSAGE_START.lastIndex = lastIndex;
      if (RE_MESSAGE_START.test(source)) {
        yield lastIndex;
        lastIndex = RE_MESSAGE_START.lastIndex;
      } else {
        break;
      }
    }
  }

  test(re) {
    re.lastIndex = this._index;
    return re.test(this._source);
  }

  skip(re) {
    if (this.test(re)) {
      this._index = re.lastIndex;
    }
  }

  match(re) {
    re.lastIndex = this._index;
    let result = re.exec(this._source);

    if (result === null) {
      this._index += 1;
      throw new SyntaxError();
    }

    this._index = re.lastIndex;
    return result[1];
  }

  /**
   * Parse the source string from the current index as an FTL message
   * and add it to the entries property on the Parser.
   *
   * @private
   */
  getMessage() {
    let id = this.match(RE_MESSAGE_START);
    let value = this.getPattern();
    let attrs = this.getAttributes();
    return [id, {value, attrs}];
  }

  /**
   * Skip multiline whitespace. Return true if it was indented.
   *
   * @private
   */
  skipIndent() {
    let start = this._index;
    this.skip(RE_BLANK);

    switch (this._source[this._index]) {
      case ".":
      case "[":
      case "*":
      case "}":
        return false;
      case "{":
        return this._source.slice(start, this._index);
    }
    switch (this._source[this._index - 1]) {
      case " ":
        return this._source.slice(start, this._index);
      default:
        return false;
    }
  }

  getPattern() {
    if (this.test(RE_TEXT_ELEMENT)) {
      var first = this.match(RE_TEXT_ELEMENT);
    }

    if (this._source[this._index] === "{") {
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

      if (this._source[this._index] === "{") {
        let element = this.getPlaceable();
        elements.push(element);
        placeableCount++;
        if (placeableCount > MAX_PLACEABLES) {
          throw new SyntaxError();
        }
        this._index++;
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
    this._index++;
    const next = this._source[this._index];

    if (specials.includes(next)) {
      this._index++;
      return next;
    }

    if (next === "u") {
      const sequence = this._source.slice(this._index + 1, this._index + 5);
      if (RE_UNICODE_ESCAPE.test(sequence)) {
        this._index += 5;
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
    this._index++;

    const onlyVariants = this.getVariants();
    if (onlyVariants) {
      return {type: "select", selector: null, ...onlyVariants};
    }

    const selector = this.getSelectorExpression();

    this.skip(RE_BLANK);

    const ch = this._source[this._index];

    if (ch === "}") {
      return selector;
    }

    this._index += 2; // ->
    return {
      type: "select",
      selector,
      ...this.getVariants()
    };
  }

  /**
   * Parses a selector expression.
   *
   * @returns {Object}
   * @private
   */
  getSelectorExpression() {
    if (this._source[this._index] === "{") {
      return this.getPlaceable();
    }

    const literal = this.getLiteral();

    if (literal.type !== "ref") {
      return literal;
    }

    if (this._source[this._index] === ".") {
      this._index++;

      const name = this.match(RE_IDENTIFIER);
      this._index++;
      return {
        type: "getattr",
        id: literal,
        name
      };
    }

    if (this._source[this._index] === "[") {
      this._index++;

      const key = this.getVariantKey();
      this._index++;
      return {
        type: "getvar",
        id: literal,
        key
      };
    }

    if (this._source[this._index] === "(") {
      this._index++;
      const args = this.getCallArgs();

      this._index++;

      literal.type = "fun";

      return {
        type: "call",
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

    while (this._index < this._length) {
      this.skip(RE_BLANK);

      if (this._source[this._index] === ")") {
        return args;
      }

      const exp = this.getSelectorExpression();

      // MessageReference in this place may be an entity reference, like:
      // `call(foo)`, or, if it's followed by `:` it will be a key-value pair.
      if (exp.type === "ref") {
        this.skip(RE_BLANK);

        if (this._source[this._index] === ":") {
          this._index++;
          this.skip(RE_BLANK);

          args.push({
            type: "narg",
            name: exp.name,
            value: this.getSelectorExpression(),
          });

        } else {
          args.push(exp);
        }
      } else {
        args.push(exp);
      }

      this.skip(RE_BLANK);

      if (this._source[this._index] === ")") {
        break;
      } else if (this._source[this._index] === ",") {
        this._index++;
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

    while (this._index < this._length) {
      this.skip(RE_BLANK);

      RE_VARIANT_START.lastIndex = this._index;
      const result = RE_VARIANT_START.exec(this._source);

      if (result === null) {
        break;
      }

      if (this._source[this._index] === "*") {
        this._index += 2;
        def = index;
      } else {
        this._index++
      }

      const key = this.getVariantKey();

      this._index = RE_VARIANT_START.lastIndex;
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
    if (this.test(RE_NUMBER_LITERAL)) {
      var literal = this.getNumber();
    } else {
      var literal = this.match(RE_IDENTIFIER);
    }

    this._index++;
    return literal;
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
    if (this._source[this._index] === "$") {
      this._index++;
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

/**
 * Parses an FTL string using RuntimeParser and returns the generated
 * object with entries and a list of errors.
 *
 * @param {String} string
 * @returns {Object}
 */
export default function parse(string) {
  const parser = new RuntimeParser();
  return parser.getResource(string);
}
