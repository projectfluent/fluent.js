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
 * Fluent Resource is a structure storing a map of parsed localization entries.
 */
export default class FluentResource extends Map {
  /**
   * Create a new FluentResource from Fluent code.
   */
  static fromString(source) {
    RE_MESSAGE_START.lastIndex = 0;

    let resource = new this();
    let cursor = 0;

    // Iterate over the beginnings of messages and terms to efficiently skip
    // comments and recover from errors.
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
          // Don't report any Fluent syntax errors. Skip directly to the
          // beginning of the next message or term.
          continue;
        }
        throw err;
      }
    }

    return resource;

    // The parser implementation is inlined below for performance reasons.

    // The parser focuses on minimizing the number of false negatives at the
    // expense of increasing the risk of false positives. In other words, it
    // aims at parsing valid Fluent messages with a success rate of 100%, but it
    // may also parse a few invalid messages which the reference parser would
    // reject. The parser doesn't perform any validation and may produce entries
    // which wouldn't make sense in the real world. For best results users are
    // advised to validate translations with the fluent-syntax parser
    // pre-runtime.

    // The parser makes an extensive use of sticky regexes which can be anchored
    // to any offset of the source string without slicing it. Errors are thrown
    // to bail out of parsing of ill-formed messages.

    function test(re) {
      re.lastIndex = cursor;
      return re.test(source);
    }

    // Execute a regex, advance the cursor, and return the capture group.
    function match(re) {
      re.lastIndex = cursor;
      let result = re.exec(source);
      if (result === null) {
        throw new FluentError();
      }
      cursor = re.lastIndex;
      return result[1];
    }

    // Advance the cursor by one char, if matching. Optionally, throw the
    // specified error otherwise.
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

        let name = match(RE_ATTRIBUTE_START);
        attrs[name] = parsePattern();
      }

      return hasAttributes ? attrs : null;
    }

    function parsePattern() {
      // First try to parse any simple text on the same line as the id.
      if (test(RE_TEXT_VALUE)) {
        var first = match(RE_TEXT_VALUE);
      }

      // If there's an backslash escape or a placeable on the first line, fall
      // back to parsing a complex pattern.
      switch (source[cursor]) {
        case "{":
        case "\\":
          return first
            // Re-use the text parsed above, if possible.
            ? parsePatternElements(first)
            : parsePatternElements();
      }

      // RE_TEXT_VALUE stops at newlines. Only continue parsing the pattern if
      // what comes after the newline is indented.
      let block = parseIndent();
      if (block) {
        return first
          // If there's text on the first line, the blank block is part of the
          // translation content.
          ? parsePatternElements(first, trim(block))
          // Otherwise, we're dealing with a block pattern. The blank block is
          // the leading whitespace; discard it.
          : parsePatternElements();
      }

      if (first) {
        // It was just a simple inline text after all.
        return trim(first);
      }

      return null;
    }

    // Parse a complex pattern as an array of elements.
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
        // Trim the trailing whitespace of the last element if it's a
        // TextElement. Use a flag rather than a typeof check to tell
        // TextElements and StringLiterals apart (both are strings).
        let lastIndex = elements.length - 1;
        elements[lastIndex] = trim(elements[lastIndex]);
      }

      return elements;
    }

    function parsePlaceable() {
      consume("{", FluentError);
      skipBlank();

      // VariantLists are parsed as selector-less SelectExpressions.
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
        // Support nested placeables.
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
          case ")": // End of the argument list.
            cursor++;
            return args;
          case ",": // Parse another argument.
            cursor++;
            continue;
          case undefined: // EOF
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
      let count = 0;
      let star;

      while (true) {
        skipBlank();
        if (!test(RE_VARIANT_START)) {
          break;
        }

        if (consume("*")) {
          star = count;
        }

        let key = parseVariantKey();
        cursor = RE_VARIANT_START.lastIndex;
        let value = parsePattern();
        variants[count++] = {key, value};
      }

      return count > 0 ? {variants, star} : null;
    }

    function parseVariantKey() {
      consume("[", FluentError);
      skipBlank();
      if (test(RE_NUMBER_LITERAL)) {
        var key = parseNumber();
      } else {
        var key = match(RE_IDENTIFIER);
      }
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

        // We've reached an EOL of EOF.
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

    // Parse blank space. Return it if it looks like indent before a pattern
    // line. Skip it othwerwise.
    function parseIndent() {
      let start = cursor;
      skipBlank();

      switch (source[cursor]) {
        case ".":
        case "[":
        case "*":
        case "}":
        case undefined: // EOF
          return false;
        case "{":
          // Placeables don't require indentation. (EBNF: block-placeable)
          return source.slice(start, cursor).replace(RE_CRLF, "\n");
      }

      // If the first character on the line is not one of the special characters
      // listed above, check if there's at least one space of indent before it.
      if (source[cursor - 1] === " ") {
        // It's a text continuation. (EBNF: indented-char)
        return source.slice(start, cursor).replace(RE_CRLF, "\n");
      }

      return false;
    }

    // Trim spaces trailing on every line of text.
    function trim(text) {
      return text.replace(RE_TRAILING_SPACES, "");
    }
  }
}
