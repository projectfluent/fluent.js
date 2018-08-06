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
const numberRe = /-?[0-9]+(\.[0-9]+)?/y;
const stringRe = /".*?"/y;

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
        //console.error(e);
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
    let val = this.getPatternRegex();
    this.skip(whitespaceRe);
    //console.log(this._source.slice(0, this._index) + "|");
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
    indentRe.lastIndex = this._index;
    if (!indentRe.test(this._source)) {
      return false;
    }
    let start = this._index;

    this._index = indentRe.lastIndex;
    switch (this._source[this._index]) {
      case ".":
      case "[":
      case "*":
      case "}":
        return false;
      default:
        return this._source.slice(start, this._index);
    }
  }

  getPatternRegex() {
    let elements = [];
    while (true) {
      if (this.test(textElementRe)) {
        let element = this.match(textElementRe);
        elements.push(element);

        //console.log(this._source.slice(0, this._index) + "|");
      }

      let block = this.skipIndent();

      if (block) {
        elements.push(block.replace(/ /g, ""));
        continue;
      }

      break;
    }

    if (elements.length === 0) {
      return null;
    }

    if (elements.length === 1) {
      return elements[0];
    }

    return elements;
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
    let eol = this._source.indexOf("\n", this._index);

    if (eol === -1) {
      eol = this._length;
    }

    const firstLineContent = start !== eol ?
      this._source.slice(start, eol) : null;

    if (firstLineContent && firstLineContent.includes("{")) {
      return this.getComplexPattern();
    }

    this._index = eol;

    if (!this.skipIndent()) {
      return firstLineContent;
    }

    if (firstLineContent) {
      // It's a multiline pattern which started on the same line as the
      // identifier. Reparse the whole pattern to make sure we get all of it.
      this._index = start;
    }

    return this.getComplexPattern();
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
    let buffer = "";
    const content = [];
    let placeables = 0;


    outer:
    while (this._index < this._length) {

      let ch = this._source[this._index];

      // This block handles multi-line strings combining strings separated
      // by new line.
      if (ch === "\n") {

        const blankLinesStart = this._index;

        if (this.skipIndent()) {
          ch = this._source[this._index];
        } else {
          break outer;
        }

        const blankLinesEnd = this._index - 1;
        const blank = this._source.substring(blankLinesStart, blankLinesEnd);

        // normalize new lines
        buffer += blank.replace(/\n[ \t]*/g, "\n");
      }

      if (ch === undefined) {
        break;
      }

      if (ch === "\\") {
        buffer += this.getEscapedCharacter();
        ch = this._source[this._index];
        continue;
      }

      if (ch === "{") {
        // Push the buffer to content array right before placeable
        if (buffer.length) {
          content.push(buffer);
        }
        if (placeables > MAX_PLACEABLES - 1) {
          throw new SyntaxError();
        }
        buffer = "";
        content.push(this.getPlaceable());

        ch = this._source[++this._index];
        placeables++;
        continue;
      }

      buffer += ch;
      ch = this.source[++this._index];
    }

    if (content.length === 0) {
      return buffer.length ? buffer : null;
    }

    if (buffer.length) {
      content.push(buffer);
    }

    return content;
  }
  /* eslint-enable complexity */

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
   * Get simple string argument enclosed in `"`.
   *
   * @returns {String}
   * @private
   */
  getString() {
    stringRe.lastIndex = this._index;
    const result = stringRe.exec(this._source);
    this._index = stringRe.lastIndex;

    // Trim the quotes
    return result[0].slice(1, -1);
  }

  /**
   * Parses an FTL Number.
   *
   * @returns {Object}
   * @private
   */
  getNumber() {
    numberRe.lastIndex = this._index;
    const result = numberRe.exec(this._source);
    this._index = numberRe.lastIndex;

    return {
      type: "num",
      val: result[0]
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
      const val = this.getPatternRegex();
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
      return this.getString();
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
