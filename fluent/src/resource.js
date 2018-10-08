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
        resource.set(next[1], parseMessage());
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

    function parseMessage() {
      let value = parsePattern();
      let attrs = parseAttributes();
      return {value, attrs};
    }

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

    function parsePattern() {
      if (test(RE_TEXT_ELEMENT)) {
        var first = match(RE_TEXT_ELEMENT);
      }

      if (source[cursor] === "{") {
        return first
          ? parsePatternElements(first)
          : parsePatternElements();
      }

      let block = skipIndent();
      if (block) {
        return first
          ? parsePatternElements(first, block)
          : parsePatternElements(block);
      }

      return first;
    }

    function parsePatternElements(...elements) {
      let placeableCount = 0;

      while (true) {
        if (test(RE_TEXT_ELEMENT)) {
          let element = match(RE_TEXT_ELEMENT);
          elements.push(element);
          continue;
        }

        if (source[cursor] === "{") {
          let element = parsePlaceable();
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
     */
    function parseEscapedCharacter(specials = ["{", "\\"]) {
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

    function parsePlaceable() {
      cursor++;

      const onlyVariants = parseVariants();
      if (onlyVariants) {
        return {type: "select", selector: null, ...onlyVariants};
      }

      const selector = parseInlineExpression();

      skip(RE_BLANK);

      const ch = source[cursor];

      if (ch === "}") {
        return selector;
      }

      cursor += 2; // ->
      return {
        type: "select",
        selector,
        ...parseVariants()
      };
    }

    function parseInlineExpression() {
      if (source[cursor] === "{") {
        return parsePlaceable();
      }

      const literal = parseLiteral();

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
        const key = parseVariantKey();
        cursor++;
        return {
          type: "getvar",
          id: literal,
          key
        };
      }

      if (source[cursor] === "(") {
        cursor++;
        const args = parseCallArgs();
        cursor++;
        return {
          type: "call",
          fun: {...literal, type: "fun"},
          args
        };
      }

      return literal;
    }

    function parseCallArgs() {
      const args = [];

      while (cursor < source.length) {
        skip(RE_BLANK);

        if (source[cursor] === ")") {
          return args;
        }

        const exp = parseInlineExpression();

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
              value: parseInlineExpression(),
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

    function parseAttributes() {
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
        let value = parsePattern();

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

    function parseVariants() {
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

        const key = parseVariantKey();
        cursor = RE_VARIANT_START.lastIndex;
        const value = parsePattern();
        vars[index++] = {key, value};
      }

      return index > 0 ? {vars, def} : null;
    }

    function parseVariantKey() {
      skip(RE_BLANK);
      let key = test(RE_NUMBER_LITERAL)
        ? parseNumber()
        : match(RE_IDENTIFIER);
      skip(RE_BLANK);
      return key;
    }

    function parseNumber() {
      return {
        type: "num",
        value: match(RE_NUMBER_LITERAL),
      };
    }

    function parseLiteral() {
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
        return parseNumber();
      }

      if (test(RE_STRING_LITERAL)) {
        return match(RE_STRING_LITERAL);
      }

      throw new SyntaxError();
    }
  }
}
