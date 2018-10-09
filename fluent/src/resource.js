const MAX_PLACEABLES = 100;

const RE_MESSAGE_START = /^(-?[a-zA-Z][a-zA-Z0-9_-]*) *= */mg;
const RE_ATTRIBUTE_START = /\.([a-zA-Z][a-zA-Z0-9_-]*) *= */y;
const RE_VARIANT_START = /\*?\[.*?] */y;

const RE_IDENTIFIER = /(-?[a-zA-Z][a-zA-Z0-9_-]*)/y;
const RE_NUMBER_LITERAL = /(-?[0-9]+(\.[0-9]+)?)/y;
const RE_STRING_VALUE = /([^\\"\n\r]*)/y;
const RE_TEXT_VALUE = /([^\\{\n\r]+)/y;

const RE_TEXT_ESCAPE = /\\([\\{])/y;
const RE_STRING_ESCAPE = /\\([\\"])/y;
const RE_UNICODE_ESCAPE = /\\u([a-fA-F0-9]{4})/y;

const RE_BLANK = /\s+/y;
const RE_TRAILING_SPACES = / +$/mg;

/**
 * Fluent Resource is a structure storing a map
 * of parsed localization entries.
 */
export default class FluentResource extends Map {
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

    function skipBlank() {
      if (test(RE_BLANK)) {
        cursor = RE_BLANK.lastIndex;
      }
    }

    function parseMessage() {
      let value = parsePattern();
      let attrs = parseAttributes();

      if (attrs === null) {
        return value;
      }

      return {value, attrs};
    }

    function parseAttributes() {
      let attrs = {};
      let hasAttributes = false;

      while (true) {
        skipBlank();
        if (!test(RE_ATTRIBUTE_START)) {
          break;
        } else if (!hasAttributes) {
          hasAttributes = true;
        }

        let key = match(RE_ATTRIBUTE_START);
        let value = parsePattern();
        attrs[key] = value;
      }

      return hasAttributes ? attrs : null;
    }

    function parsePattern() {
      if (test(RE_TEXT_VALUE)) {
        var first = match(RE_TEXT_VALUE);
      }

      switch (source[cursor]) {
        case "{":
        case "\\":
          return first
            ? parsePatternElements(first)
            : parsePatternElements();
      }

      let block = parseIndent();
      if (block) {
        return first
          ? parsePatternElements(first, normalize(block))
          : parsePatternElements();
      }

      if (first) {
        return normalize(first);
      }

      return null;
    }

    function parsePatternElements(...elements) {
      let placeableCount = 0;
      let needsTrimming = false;

      while (true) {
        if (test(RE_TEXT_VALUE)) {
          elements.push(match(RE_TEXT_VALUE));
          needsTrimming = true;
          continue;
        }

        if (source[cursor] === "{") {
          elements.push(parsePlaceable());
          needsTrimming = false;
          if (++placeableCount > MAX_PLACEABLES) {
            throw new SyntaxError();
          }
          cursor++;
          continue;
        }

        let block = parseIndent();
        if (block) {
          elements.push(normalize(block));
          needsTrimming = false;
          continue;
        }

        if (source[cursor] === "\\") {
          elements.push(parseEscape(RE_TEXT_ESCAPE));
          needsTrimming = false;
          continue;
        }

        break;
      }

      if (needsTrimming) {
        let lastIndex = elements.length - 1;
        elements[lastIndex] = normalize(elements[lastIndex]);
      }

      return elements;
    }

    function parsePlaceable() {
      cursor++;

      let onlyVariants = parseVariants();
      if (onlyVariants) {
        return {type: "select", selector: null, ...onlyVariants};
      }

      let selector = parseInlineExpression();
      skipBlank();

      if (source[cursor] === "}") {
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

      let literal = parseLiteral();
      if (literal.type !== "ref") {
        return literal;
      }

      if (source[cursor] === ".") {
        cursor++;
        let name = match(RE_IDENTIFIER);
        return {
          type: "getattr",
          id: literal,
          name
        };
      }

      if (source[cursor] === "[") {
        cursor++;
        let key = parseVariantKey();
        cursor++;
        return {
          type: "getvar",
          id: literal,
          key
        };
      }

      if (source[cursor] === "(") {
        cursor++;
        let args = parseArguments();
        cursor++;
        return {
          type: "call",
          fun: {...literal, type: "fun"},
          args
        };
      }

      return literal;
    }

    function parseArguments() {
      let args = [];

      while (cursor < source.length) {
        skipBlank();

        if (source[cursor] === ")") {
          return args;
        }

        let exp = parseInlineExpression();

        // MessageReference in this place may be an entity reference, like:
        // `call(foo)`, or, if it's followed by `:` it will be a key-value pair.
        if (exp.type === "ref") {
          skipBlank();

          if (source[cursor] === ":") {
            cursor++;
            skipBlank();

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

        skipBlank();

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

    function parseVariants() {
      let vars = [];
      let index = 0;
      let def;

      while (cursor < source.length) {
        skipBlank();
        if (!test(RE_VARIANT_START)) {
          break;
        }

        if (source[cursor] === "*") {
          cursor += 2;
          def = index;
        } else {
          cursor++
        }

        let key = parseVariantKey();
        cursor = RE_VARIANT_START.lastIndex;
        let value = parsePattern();
        vars[index++] = {key, value};
      }

      return index > 0 ? {vars, def} : null;
    }

    function parseVariantKey() {
      skipBlank();
      let key = test(RE_NUMBER_LITERAL)
        ? parseNumber()
        : match(RE_IDENTIFIER);
      skipBlank();
      return key;
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

      if (source[cursor] === "\"") {
        return parseString();
      }

      throw new SyntaxError();
    }

    function parseNumber() {
      return {
        type: "num",
        value: match(RE_NUMBER_LITERAL),
      };
    }

    function parseString() {
      cursor++;
      let value = "";
      while (true) {
        value += match(RE_STRING_VALUE);
        switch (source[cursor]) {
          case "\\":
            value += parseEscape(RE_STRING_ESCAPE);
            continue;
          case "\"":
            cursor++;
            return value;
          default:
            throw new SyntaxError();
        }
      }
    }

    function parseEscape(reSpecialized) {
      if (test(RE_UNICODE_ESCAPE)) {
        let sequence = match(RE_UNICODE_ESCAPE);
        return String.fromCodePoint(parseInt(sequence, 16));
      }

      if (test(reSpecialized)) {
        return match(reSpecialized);
      }

      throw new SyntaxError();
    }

    function parseIndent() {
      let start = cursor;
      skipBlank();

      switch (source[cursor]) {
        case ".":
        case "[":
        case "*":
        case "}":
          return false;
        case "{":
          return source.slice(start, cursor);
      }

      if (source[cursor - 1] === " ") {
        return source.slice(start, cursor);
      }

      return false;
    }

    function normalize(text) {
      return text.replace(RE_TRAILING_SPACES, "");
    }
  }
}
