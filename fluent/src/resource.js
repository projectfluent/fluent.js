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
 * Fluent Resource is a structure storing a map
 * of parsed localization entries.
 */
export default class FluentResource extends Map {
  constructor(entries) {
    super(entries);
  }

  static fromString(source) {
    RE_MESSAGE_START.lastIndex = 0;

    let cursor = 0;
    let resource = new this();

    while (true) {
      let next = RE_MESSAGE_START.exec(source);
      if (next === null) {
        break;
      }

      cursor = RE_MESSAGE_START.lastIndex;
      try {
        resource.set(next[1], getMessage());
      } catch (e) {
        console.error(e);
        continue;
      }
    }

    return resource;

    function test(re) {
      re.lastIndex = cursor;
      return re.test(source);
    }

    function skip(re) {
      if (test(re)) {
        cursor = re.lastIndex;
      }
    }

    function match(re) {
      re.lastIndex = cursor;
      let result = re.exec(source);

      if (result === null) {
        cursor += 1;
        throw new SyntaxError();
      }

      cursor = re.lastIndex;
      return result[1];
    }

    /**
     * Parse the source string from the current index as an FTL message
     * and add it to the entries property on the Parser.
     *
     * @private
     */
    function getMessage() {
      let value = getPattern();
      let attrs = getAttributes();
      return {value, attrs};
    }

    /**
     * Skip multiline whitespace. Return true if it was indented.
     *
     * @private
     */
    function skipIndent() {
      let start = cursor;
      skip(RE_BLANK);

      switch (source[cursor]) {
        case ".":
        case "[":
        case "*":
        case "}":
          return false;
        case "{":
          return source.slice(start, cursor);
      }
      switch (source[cursor - 1]) {
        case " ":
          return source.slice(start, cursor);
        default:
          return false;
      }
    }

    function getPattern() {
      if (test(RE_TEXT_ELEMENT)) {
        var first = match(RE_TEXT_ELEMENT);
      }

      if (source[cursor] === "{") {
        return first
          ? getPatternElements(first)
          : getPatternElements();
      }

      let block = skipIndent();
      if (block) {
        return first
          ? getPatternElements(first, block)
          : getPatternElements(block);
      }

      return first;
    }

    function getPatternElements(...elements) {
      let placeableCount = 0;

      while (true) {
        if (test(RE_TEXT_ELEMENT)) {
          let element = match(RE_TEXT_ELEMENT);
          elements.push(element);
          continue;
        }

        if (source[cursor] === "{") {
          let element = getPlaceable();
          elements.push(element);
          placeableCount++;
          if (placeableCount > MAX_PLACEABLES) {
            throw new SyntaxError();
          }
          cursor++;
          continue;
        }

        let block = skipIndent();
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
    function getEscapedCharacter(specials = ["{", "\\"]) {
      cursor++;
      const next = source[cursor];

      if (specials.includes(next)) {
        cursor++;
        return next;
      }

      if (next === "u") {
        const sequence = source.slice(cursor + 1, cursor + 5);
        if (RE_UNICODE_ESCAPE.test(sequence)) {
          cursor += 5;
          return String.fromCodePoint(parseInt(sequence, 16));
        }

        throw error(`Invalid Unicode escape sequence: \\u${sequence}`);
      }

      throw error(`Unknown escape sequence: \\${next}`);
    }

    /**
     * Parses a single placeable in a Message pattern and returns its
     * expression.
     *
     * @returns {Object}
     * @private
     */
    function getPlaceable() {
      cursor++;

      const onlyVariants = getVariants();
      if (onlyVariants) {
        return {type: "select", selector: null, ...onlyVariants};
      }

      const selector = getInlineExpression();

      skip(RE_BLANK);

      const ch = source[cursor];

      if (ch === "}") {
        return selector;
      }

      cursor += 2; // ->
      return {
        type: "select",
        selector,
        ...getVariants()
      };
    }

    /**
     * Parses an inline expression.
     *
     * @returns {Object}
     * @private
     */
    function getInlineExpression() {
      if (source[cursor] === "{") {
        return getPlaceable();
      }

      const literal = getLiteral();

      if (literal.type !== "ref") {
        return literal;
      }

      if (source[cursor] === ".") {
        cursor++;
        const name = match(RE_IDENTIFIER);
        return {
          type: "getattr",
          id: literal,
          name
        };
      }

      if (source[cursor] === "[") {
        cursor++;
        const key = getVariantKey();
        cursor++;
        return {
          type: "getvar",
          id: literal,
          key
        };
      }

      if (source[cursor] === "(") {
        cursor++;
        const args = getCallArgs();
        cursor++;
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
    function getCallArgs() {
      const args = [];

      while (cursor < source.length) {
        skip(RE_BLANK);

        if (source[cursor] === ")") {
          return args;
        }

        const exp = getInlineExpression();

        // MessageReference in this place may be an entity reference, like:
        // `call(foo)`, or, if it's followed by `:` it will be a key-value pair.
        if (exp.type === "ref") {
          skip(RE_BLANK);

          if (source[cursor] === ":") {
            cursor++;
            skip(RE_BLANK);

            args.push({
              type: "narg",
              name: exp.name,
              value: getInlineExpression(),
            });

          } else {
            args.push(exp);
          }
        } else {
          args.push(exp);
        }

        skip(RE_BLANK);

        if (source[cursor] === ")") {
          break;
        } else if (source[cursor] === ",") {
          cursor++;
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
    function getAttributes() {
      let attrs = {};
      let hasAttributes = false;

      while (true) {
        skip(RE_BLANK);
        if (!test(RE_ATTRIBUTE_START)) {
          break;
        } else if (!hasAttributes) {
          hasAttributes = true;
        }

        let key = match(RE_ATTRIBUTE_START);
        let value = getPattern();

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
    function getVariants() {
      const vars = [];
      let index = 0;
      let def;

      while (cursor < source.length) {
        skip(RE_BLANK);
        if (!test(RE_VARIANT_START)) {
          break;
        }

        if (source[cursor] === "*") {
          cursor += 2;
          def = index;
        } else {
          cursor++
        }

        const key = getVariantKey();
        cursor = RE_VARIANT_START.lastIndex;
        const value = getPattern();
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
    function getVariantKey() {
      skip(RE_BLANK);
      let key = test(RE_NUMBER_LITERAL)
        ? getNumber()
        : match(RE_IDENTIFIER);
      skip(RE_BLANK);
      return key;
    }

    /**
     * Parses an FTL Number.
     *
     * @returns {Object}
     * @private
     */
    function getNumber() {
      return {
        type: "num",
        value: match(RE_NUMBER_LITERAL),
      };
    }


    /**
     * Parses an FTL literal.
     *
     * @returns {Object}
     * @private
     */
    function getLiteral() {
      if (source[cursor] === "$") {
        cursor++;
        return {
          type: "var",
          name: match(RE_IDENTIFIER)
        };
      }

      if (test(RE_IDENTIFIER)) {
        return {
          type: "ref",
          name: match(RE_IDENTIFIER)
        };
      }

      if (test(RE_NUMBER_LITERAL)) {
        return getNumber();
      }

      if (test(RE_STRING_LITERAL)) {
        return match(RE_STRING_LITERAL);
      }

      throw new SyntaxError();
    }
  }
}
