import FluentError from "./error.js";

const MAX_PLACEABLES = 100;

const RE_MESSAGE_START = /^(-?[a-zA-Z][a-zA-Z0-9_-]*) *= */mg;
const RE_ATTRIBUTE_START = /\.([a-zA-Z][a-zA-Z0-9_-]*) *= */y;
// We want to match multiline variant keys. [^] is a pre-ES2018 trick
// which works around the lack of the dotall flag, /s.
const RE_VARIANT_START = /\*?\[[^]*?] */y;

const RE_IDENTIFIER = /(-?[a-zA-Z][a-zA-Z0-9_-]*)/y;
const RE_NUMBER_LITERAL = /(-?[0-9]+(\.[0-9]+)?)/y;
const RE_STRING_VALUE = /([^\\"\n\r]*)/y;
const RE_TEXT_VALUE = /([^\\{\n\r]+)/y;
const RE_SELECT_ARROW = /->/y;

const RE_TEXT_ESCAPE = /\\([\\{])/y;
const RE_STRING_ESCAPE = /\\([\\"])/y;
const RE_UNICODE_ESCAPE = /\\u([a-fA-F0-9]{4})/y;

const RE_BLANK = /\s+/y;
const RE_TRAILING_SPACES = / +$/mg;
const RE_CRLF = /\r\n/g;

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
      } catch (err) {
        if (err instanceof FluentError) {
          // Don't report any errors. Skip directly to the beginning of the next
          // message or term. For best results users are advised to validate
          // translations with the fluent-syntax parser pre-runtime.
          continue;
        }
        throw err;
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
        cursor++;
        throw new FluentError();
      }

      cursor = re.lastIndex;
      return result[1];
    }

    function consume(char, error) {
      if (source[cursor] === char) {
        cursor++;
        return true;
      } else if (error) {
        throw new error;
      }
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
          ? parsePatternElements(first, trim(block))
          : parsePatternElements();
      }

      if (first) {
        return trim(first);
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
          if (++placeableCount > MAX_PLACEABLES) {
            throw new FluentError();
          }
          elements.push(parsePlaceable());
          needsTrimming = false;
          continue;
        }

        let block = parseIndent();
        if (block) {
          elements.push(trim(block));
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
        elements[lastIndex] = trim(elements[lastIndex]);
      }

      return elements;
    }

    function parsePlaceable() {
      consume("{", FluentError);
      skipBlank();

      let onlyVariants = parseVariants();
      if (onlyVariants) {
        consume("}", FluentError);
        return {type: "select", selector: null, ...onlyVariants};
      }

      let selector = parseInlineExpression();
      skipBlank();
      if (consume("}")) {
        return selector;
      }

      if (test(RE_SELECT_ARROW)) {
        cursor = RE_SELECT_ARROW.lastIndex;
        let variants = parseVariants();
        consume("}", FluentError);
        return {type: "select", selector, ...variants};
      }

      throw new FluentError();
    }

    function parseInlineExpression() {
      if (source[cursor] === "{") {
        return parsePlaceable();
      }

      let ref = parseLiteral();
      if (ref.type !== "ref") {
        return ref;
      }

      if (consume(".")) {
        let name = match(RE_IDENTIFIER);
        return {type: "getattr", ref, name};
      }

      if (source[cursor] === "[") {
        return {type: "getvar", ref, selector: parseVariantKey()};
      }

      if (consume("(")) {
        let callee = {...ref, type: "func"}
        let args = parseArguments();
        return {type: "call", callee, args};
      }

      return ref;
    }

    function parseArguments() {
      let args = [];

      while (true) {
        skipBlank();

        switch (source[cursor]) {
          case ")":
            cursor++;
            return args;
          case ",":
            cursor++;
            continue;
          case undefined:
            throw new FluentError();
        }

        let ref = parseInlineExpression();
        if (ref.type !== "ref") {
          args.push(ref);
          continue;
        }

        skipBlank();
        if (consume(":")) {
          // The reference is the beginning of a named argument.
          skipBlank();
          args.push({
            type: "narg",
            name: ref.name,
            value: parseInlineExpression(),
          });
        } else {
          // It's a regular message reference.
          args.push(ref);
        }
      }
    }

    function parseVariants() {
      let variants = [];
      let index = 0;
      let star;

      while (true) {
        skipBlank();
        if (!test(RE_VARIANT_START)) {
          break;
        }

        if (consume("*")) {
          star = index;
        }

        let key = parseVariantKey();
        cursor = RE_VARIANT_START.lastIndex;
        let value = parsePattern();
        variants[index++] = {key, value};
      }

      return index > 0 ? {variants, star} : null;
    }

    function parseVariantKey() {
      consume("[", FluentError);
      skipBlank();
      let key = test(RE_NUMBER_LITERAL)
        ? parseNumber()
        : match(RE_IDENTIFIER);
      skipBlank();
      consume("]", FluentError);
      return key;
    }

    function parseLiteral() {
      if (consume("$")) {
        return {type: "var", name: match(RE_IDENTIFIER)};
      }

      if (test(RE_IDENTIFIER)) {
        return {type: "ref", name: match(RE_IDENTIFIER)};
      }

      if (test(RE_NUMBER_LITERAL)) {
        return parseNumber();
      }

      if (source[cursor] === "\"") {
        return parseString();
      }

      throw new FluentError();
    }

    function parseNumber() {
      return {type: "num", value: match(RE_NUMBER_LITERAL)};
    }

    function parseString() {
      consume("\"", FluentError);
      let value = "";
      while (true) {
        value += match(RE_STRING_VALUE);
        if (source[cursor] === "\\") {
          value += parseEscape(RE_STRING_ESCAPE);
          continue;
        }
        if (consume("\"")) {
          return value;
        }
        throw new FluentError();
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

      throw new FluentError();
    }

    function parseIndent() {
      let start = cursor;
      skipBlank();

      switch (source[cursor]) {
        case ".":
        case "[":
        case "*":
        case "}":
        case undefined:
          return false;
        case "{":
          return source.slice(start, cursor).replace(RE_CRLF, "\n");
      }

      if (source[cursor - 1] === " ") {
        return source.slice(start, cursor).replace(RE_CRLF, "\n");
      }

      return false;
    }

    function trim(text) {
      return text.replace(RE_TRAILING_SPACES, "");
    }
  }
}
