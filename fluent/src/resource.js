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
        resource.set(next[1], Message());
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
        throw new FluentError(`Expected ${re.toString()}`);
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
        throw new error(`Expected ${char}`);
      }
      return false;
    }

    function skipBlank() {
      if (test(RE_BLANK)) {
        cursor = RE_BLANK.lastIndex;
      }
    }

    function Message() {
      let value = Pattern();
      let attrs = Attributes();

      if (attrs === null) {
        return value;
      }

      return {value, attrs};
    }

    function Attributes() {
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
        attrs[name] = Pattern();
      }

      return hasAttributes ? attrs : null;
    }

    function Pattern() {
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
            ? PatternElements(first)
            : PatternElements();
      }

      // RE_TEXT_VALUE stops at newlines. Only continue parsing the pattern if
      // what comes after the newline is indented.
      let indent = Indent();
      if (indent) {
        return first
          // If there's text on the first line, the blank block is part of the
          // translation content.
          ? PatternElements(first, trim(indent))
          // Otherwise, we're dealing with a block pattern. The blank block is
          // the leading whitespace; discard it.
          : PatternElements();
      }

      if (first) {
        // It was just a simple inline text after all.
        return trim(first);
      }

      return null;
    }

    // Parse a complex pattern as an array of elements.
    function PatternElements(...elements) {
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
            throw new FluentError("Too many placeables");
          }
          elements.push(Placeable());
          needsTrimming = false;
          continue;
        }

        let indent = Indent();
        if (indent) {
          elements.push(trim(indent));
          needsTrimming = false;
          continue;
        }

        if (source[cursor] === "\\") {
          elements.push(EscapeSequence(RE_TEXT_ESCAPE));
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

    function Placeable() {
      consume("{", FluentError);
      skipBlank();

      // VariantLists are parsed as selector-less SelectExpressions.
      let onlyVariants = Variants();
      if (onlyVariants) {
        consume("}", FluentError);
        return {type: "select", selector: null, ...onlyVariants};
      }

      let selector = InlineExpression();
      skipBlank();
      if (consume("}")) {
        return selector;
      }

      if (test(RE_SELECT_ARROW)) {
        cursor = RE_SELECT_ARROW.lastIndex;
        let variants = Variants();
        consume("}", FluentError);
        return {type: "select", selector, ...variants};
      }

      throw new FluentError("Unclosed placeable");
    }

    function InlineExpression() {
      if (source[cursor] === "{") {
        // Support nested placeables.
        return Placeable();
      }

      if (consume("$")) {
        return {type: "var", name: match(RE_IDENTIFIER)};
      }

      if (test(RE_IDENTIFIER)) {
        let ref = {type: "ref", name: match(RE_IDENTIFIER)};

        if (consume(".")) {
          let name = match(RE_IDENTIFIER);
          return {type: "getattr", ref, name};
        }

        if (source[cursor] === "[") {
          return {type: "getvar", ref, selector: VariantKey()};
        }

        if (consume("(")) {
          let callee = {...ref, type: "func"};
          return {type: "call", callee, args: Arguments()};
        }

        return ref;
      }

      return Literal();
    }

    function Arguments() {
      let args = [];

      while (true) {
        skipBlank();

        switch (source[cursor]) {
          case ")": // End of the argument list.
            cursor++;
            return args;
          case undefined: // EOF
            throw new FluentError("Unclosed argument list");
        }

        args.push(Argument());
        skipBlank();
        consume(",");
      }
    }

    function Argument() {
      let ref = InlineExpression();
      if (ref.type !== "ref") {
        return ref;
      }

      skipBlank();
      if (consume(":")) {
        // The reference is the beginning of a named argument.
        skipBlank();
        return {type: "narg", name: ref.name, value: Literal()};
      }

      // It's a regular message reference.
      return ref;
    }

    function Variants() {
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

        let key = VariantKey();
        cursor = RE_VARIANT_START.lastIndex;
        variants[count++] = {key, value: Pattern()};
      }

      return count > 0 ? {variants, star} : null;
    }

    function VariantKey() {
      consume("[", FluentError);
      skipBlank();
      let key = test(RE_NUMBER_LITERAL)
        ? NumberLiteral()
        : match(RE_IDENTIFIER);
      skipBlank();
      consume("]", FluentError);
      return key;
    }

    function Literal() {
      if (test(RE_NUMBER_LITERAL)) {
        return NumberLiteral();
      }

      if (source[cursor] === "\"") {
        return StringLiteral();
      }

      throw new FluentError("Invalid expression");
    }

    function NumberLiteral() {
      return {type: "num", value: match(RE_NUMBER_LITERAL)};
    }

    function StringLiteral() {
      consume("\"", FluentError);
      let value = "";
      while (true) {
        value += match(RE_STRING_VALUE);

        if (source[cursor] === "\\") {
          value += EscapeSequence(RE_STRING_ESCAPE);
          continue;
        }

        if (consume("\"")) {
          return value;
        }

        // We've reached an EOL of EOF.
        throw new FluentError("Unclosed string literal");
      }
    }

    function EscapeSequence(reSpecialized) {
      if (test(RE_UNICODE_ESCAPE)) {
        let sequence = match(RE_UNICODE_ESCAPE);
        return String.fromCodePoint(parseInt(sequence, 16));
      }

      if (test(reSpecialized)) {
        return match(reSpecialized);
      }

      throw new FluentError("Unknown escape sequence");
    }

    // Parse blank space. Return it if it looks like indent before a pattern
    // line. Skip it othwerwise.
    function Indent() {
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
