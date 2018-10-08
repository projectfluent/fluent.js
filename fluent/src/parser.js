/*  eslint no-magic-numbers: [0]  */

const MAX_PLACEABLES = 100;

const unicodeEscapeRe = /^[a-fA-F0-9]{4}$/;

const messageStartRe = /^(-?[a-zA-Z][a-zA-Z0-9_-]*) *= */my;
const attributeStartRe = /\.([a-zA-Z][a-zA-Z0-9_-]*) *= */y;
const variantStartRe = /\*?\[.*?] */y;

const textElementRe = /([^\\{\n\r]+)/y;

const whitespaceRe = /\s+/y;
const indentRe = /\s*\n * /y;

const identifierRe = /(-?[a-zA-Z][a-zA-Z0-9_-]*)/y;
const numberRe = /(-?[0-9]+(\.[0-9]+)?)/y;
const stringRe = /"(.*?)"/y;

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
      messageStartRe.lastIndex = lastIndex;
      if (messageStartRe.test(source)) {
        yield messageStartRe.lastIndex = lastIndex;
      }

      let lineEnd = source.indexOf("\n", lastIndex);
      if (lineEnd === -1) {
        break;
      }

      lastIndex = lineEnd + 1;
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
    let id = this.match(messageStartRe);
    let val = this.getPattern();
    this.skip(whitespaceRe);
    let attrs = this.getAttributes();

    if (attrs === null && typeof val === "string") {
      return [id, val];
    }

    return [id, {val, attrs}];
  }

  /**
   * Skip multiline whitespace. Return true if it was indented.
   *
   * @private
   */
  skipIndent() {
    let start = this._index;
    this.skip(whitespaceRe);

    switch (this._source[this._index]) {
      case ".":
      case "[":
      case "*":
      case "}":
        return false;
    }
    switch (this._source[this._index - 1]) {
      case " ":
        return this._source.slice(start, this._index);
      default:
        return false;
    }
  }

  getPattern() {
    if (this.test(textElementRe)) {
      var first = this.match(textElementRe);
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
      if (this.test(textElementRe)) {
        let element = this.match(textElementRe);
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
      if (unicodeEscapeRe.test(sequence)) {
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
    const start = ++this._index;

    const onlyVariants = this.getVariants();
    if (onlyVariants) {
      return {type: "sel", sel: null, ...onlyVariants};
    }

    const selector = this.getSelectorExpression();

    this.skip(whitespaceRe);

    const ch = this._source[this._index];

    if (ch === "}") {
      return selector;
    }

    this._index += 2; // ->
    return {type: "sel", sel: null, ...this.getVariants()};
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

      const name = this.match(identifierRe);
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
      this.skip(whitespaceRe);

      if (this._source[this._index] === ")") {
        return args;
      }

      const exp = this.getSelectorExpression();

      // MessageReference in this place may be an entity reference, like:
      // `call(foo)`, or, if it's followed by `:` it will be a key-value pair.
      if (exp.type !== "ref") {
        args.push(exp);
      } else {
        this.skipInlineWS();

        if (this._source[this._index] === ":") {
          this._index++;
          this.skip(whitespaceRe);

          const val = this.getSelectorExpression();

          // If the expression returned as a value of the argument
          // is not a quote delimited string or number, throw.
          //
          // We don't have to check here if the pattern is quote delimited
          // because that's the only type of string allowed in expressions.
          if (typeof val === "string" ||
              Array.isArray(val) ||
              val.type === "num") {
            args.push({
              type: "narg",
              name: exp.name,
              val
            });
          } else {
            this._index = this._source.lastIndexOf(":", this._index) + 1;
            throw this.error(
              "Expected string in quotes, number.");
          }

        } else {
          args.push(exp);
        }
      }

      this.skip(whitespaceRe);

      if (this._source[this._index] === ")") {
        break;
      } else if (this._source[this._index] === ",") {
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
    return {
      type: "num",
      val: this.match(numberRe),
    };
  }

  /**
   * Parses a list of Message attributes.
   *
   * @returns {Object?}
   * @private
   */
  getAttributes() {
    const attrs = {};
    let hasAttributes = false;

    while (this._index < this._length) {
      attributeStartRe.lastIndex = this._index;
      const result = attributeStartRe.exec(this._source);

      if (result === null) {
        break;
      } else if (!hasAttributes) {
        hasAttributes = true;
      }

      this._index = attributeStartRe.lastIndex;

      const key = result[1];
      const val = this.getPattern();
      this.skip(whitespaceRe);

      if (typeof val === "string") {
        attrs[key] = val;
      } else {
        attrs[key] = {
          val
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
      this.skip(whitespaceRe);

      variantStartRe.lastIndex = this._index;
      const result = variantStartRe.exec(this._source);

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

      this._index = variantStartRe.lastIndex;
      const val = this.getPattern();
      vars[index++] = {key, val};
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
    let literal;

    numberRe.lastIndex = this._index;
    if (numberRe.test(this._source)) {
      literal = this.getNumber();
    } else {
      literal = this.match(identifierRe);
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
    if (this._source[this._index] === "$") {
      this._index++;
      return {
        type: "var",
        name: this.match(identifierRe)
      };
    }

    identifierRe.lastIndex = this._index;
    if (identifierRe.test(this._source)) {
      return {
        type: "ref",
        name: this.match(identifierRe)
      };
    }

    numberRe.lastIndex = this._index;
    if (numberRe.test(this._source)) {
      return this.getNumber();
    }

    stringRe.lastIndex = this._index;
    if (stringRe.test(this._source)) {
      return this.match(stringRe);
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
