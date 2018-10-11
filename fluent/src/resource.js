import FluentError from "./error.js";

// This regex is used to iterate through the beginnings of messages and terms.
// With the /m flag, the ^ matches at the beginning of every line.
const RE_MESSAGE_START = /^(-?[a-zA-Z][a-zA-Z0-9_-]*) *= */mg;

// Both Attributes and Variants are parsed in while loops. These regexes are
// used to break out of them.
const RE_ATTRIBUTE_START = /\.([a-zA-Z][a-zA-Z0-9_-]*) *= */y;
// [^] matches all characters, including newlines.
// XXX Use /s (dotall) when it's widely supported.
const RE_VARIANT_START = /\*?\[[^]*?] */y;

const RE_IDENTIFIER = /(-?[a-zA-Z][a-zA-Z0-9_-]*)/y;
const RE_NUMBER_LITERAL = /(-?[0-9]+(\.[0-9]+)?)/y;

// A "run" is a sequence of text or string literal characters which don't
// require any special handling. For TextElements such special characters are:
// { (starts a placeable), \ (starts an escape sequence), and line breaks which
// require additional logic to check if the next line is indented. For
// StringLiterals they are: \ (starts an escape sequence), " (ends the
// literal), and line breaks which are not allowed in StringLiterals. Also note
// that string runs may be empty, but text runs may not.
const RE_TEXT_RUN = /([^\\{\n\r]+)/y;
const RE_STRING_RUN = /([^\\"\n\r]*)/y;

// Escape sequences.
const RE_UNICODE_ESCAPE = /\\u([a-fA-F0-9]{4})/y;
const RE_STRING_ESCAPE = /\\([\\"])/y;
const RE_TEXT_ESCAPE = /\\([\\{])/y;

// Used for trimming TextElements and indents. With the /m flag, the $ matches
// the end of every line.
const RE_TRAILING_SPACES = / +$/mg;
// CRLFs are normalized to LF.
const RE_CRLF = /\r\n/g;

// Common tokens.
const TOKEN_BRACE_OPEN = /{\s*/y;
const TOKEN_BRACE_CLOSE = /\s*}/y;
const TOKEN_BRACKET_OPEN = /\[\s*/y;
const TOKEN_BRACKET_CLOSE = /\s*]/y;
const TOKEN_PAREN_OPEN = /\(\s*/y;
const TOKEN_ARROW = /\s*->\s*/y;
const TOKEN_COLON = /\s*:\s*/y;
// As a deviation from the well-formed Fluent grammar, accept argument lists
// without commas between arguments.
const TOKEN_COMMA = /\s*,?\s*/y;
const TOKEN_BLANK = /\s+/y;

// Maximum number of placeables in a single Pattern to protect against Quadratic
// Blowup attacks. See https://msdn.microsoft.com/en-us/magazine/ee335713.aspx.
const MAX_PLACEABLES = 100;

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

    // Advance the cursor by the char, if it matches. If not, optionally throw
    // the specified error.
    function char(ch, error) {
      if (source[cursor] === ch) {
        cursor++;
        return true;
      }
      if (error) {
        throw new error(`Expected ${ch}`);
      }
      return false;
    }

    // Advance the cursor by the token, if it matches. If not, optionally throw
    // the specified error.
    function token(re, error) {
      if (test(re)) {
        cursor = re.lastIndex;
        return true;
      }
      if (error) {
        throw new error(`Expected ${re.toString()}`);
      }
      return false;
    }

    // Execute a regex, advance the cursor, and return the capture group.
    function Match(re) {
      re.lastIndex = cursor;
      let result = re.exec(source);
      if (result === null) {
        throw new FluentError(`Expected ${re.toString()}`);
      }
      cursor = re.lastIndex;
      return result[1];
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

      while (test(RE_ATTRIBUTE_START)) {
        if (!hasAttributes) {
          hasAttributes = true;
        }

        let name = Match(RE_ATTRIBUTE_START);
        attrs[name] = Pattern();
      }

      return hasAttributes ? attrs : null;
    }

    function Pattern() {
      // First try to parse any simple text on the same line as the id.
      if (test(RE_TEXT_RUN)) {
        var first = Match(RE_TEXT_RUN);
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
        if (test(RE_TEXT_RUN)) {
          elements.push(Match(RE_TEXT_RUN));
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
      token(TOKEN_BRACE_OPEN, FluentError);

      // VariantLists are parsed as selector-less SelectExpressions.
      let onlyVariants = Variants();
      if (onlyVariants) {
        token(TOKEN_BRACE_CLOSE, FluentError);
        return {type: "select", selector: null, ...onlyVariants};
      }

      let selector = InlineExpression();
      if (token(TOKEN_BRACE_CLOSE)) {
        return selector;
      }

      if (test(TOKEN_ARROW)) {
        cursor = TOKEN_ARROW.lastIndex;
        let variants = Variants();
        token(TOKEN_BRACE_CLOSE, FluentError);
        return {type: "select", selector, ...variants};
      }

      throw new FluentError("Unclosed placeable");
    }

    function InlineExpression() {
      if (source[cursor] === "{") {
        // It's a nested placeable.
        return Placeable();
      }

      if (char("$")) {
        return {type: "var", name: Match(RE_IDENTIFIER)};
      }

      if (test(RE_IDENTIFIER)) {
        let ref = {type: "ref", name: Match(RE_IDENTIFIER)};

        if (char(".")) {
          let name = Match(RE_IDENTIFIER);
          return {type: "getattr", ref, name};
        }

        if (source[cursor] === "[") {
          return {type: "getvar", ref, selector: VariantKey()};
        }

        if (token(TOKEN_PAREN_OPEN)) {
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
        switch (source[cursor]) {
          case ")": // End of the argument list.
            cursor++;
            return args;
          case undefined: // EOF
            throw new FluentError("Unclosed argument list");
        }

        args.push(Argument());
        token(TOKEN_COMMA);
      }
    }

    function Argument() {
      let ref = InlineExpression();
      if (ref.type !== "ref") {
        return ref;
      }

      if (token(TOKEN_COLON)) {
        // The reference is the beginning of a named argument.
        return {type: "narg", name: ref.name, value: Literal()};
      }

      // It's a regular message reference.
      return ref;
    }

    function Variants() {
      let variants = [];
      let count = 0;
      let star;

      while (test(RE_VARIANT_START)) {
        if (char("*")) {
          star = count;
        }

        let key = VariantKey();
        cursor = RE_VARIANT_START.lastIndex;
        variants[count++] = {key, value: Pattern()};
      }

      return count > 0 ? {variants, star} : null;
    }

    function VariantKey() {
      token(TOKEN_BRACKET_OPEN, FluentError);
      let key = test(RE_NUMBER_LITERAL)
        ? NumberLiteral()
        : Match(RE_IDENTIFIER);
      token(TOKEN_BRACKET_CLOSE, FluentError);
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
      return {type: "num", value: Match(RE_NUMBER_LITERAL)};
    }

    function StringLiteral() {
      char("\"", FluentError);
      let value = "";
      while (true) {
        value += Match(RE_STRING_RUN);

        if (source[cursor] === "\\") {
          value += EscapeSequence(RE_STRING_ESCAPE);
          continue;
        }

        if (char("\"")) {
          return value;
        }

        // We've reached an EOL of EOF.
        throw new FluentError("Unclosed string literal");
      }
    }

    // Unescape known escape sequences.
    function EscapeSequence(reSpecialized) {
      if (test(RE_UNICODE_ESCAPE)) {
        let sequence = Match(RE_UNICODE_ESCAPE);
        return String.fromCodePoint(parseInt(sequence, 16));
      }

      if (test(reSpecialized)) {
        return Match(reSpecialized);
      }

      throw new FluentError("Unknown escape sequence");
    }

    // Parse blank space. Return it if it looks like indent before a pattern
    // line. Skip it othwerwise.
    function Indent() {
      let start = cursor;
      token(TOKEN_BLANK);

      // Check the first non-blank character after the indent.
      switch (source[cursor]) {
        case ".":
        case "[":
        case "*":
        case "}":
        case undefined: // EOF
          // A special character. End the Pattern.
          return false;
        case "{":
          // Placeables don't require indentation (in EBNF: block-placeable).
          // Continue the Pattern.
          return source.slice(start, cursor).replace(RE_CRLF, "\n");
      }

      // If the first character on the line is not one of the special characters
      // listed above, it's a regular text character. Check if there's at least
      // one space of indent before it.
      if (source[cursor - 1] === " ") {
        // It's an indented text character (in EBNF: indented-char). Continue
        // the Pattern.
        return source.slice(start, cursor).replace(RE_CRLF, "\n");
      }

      // A not-indented text character is likely the identifier of the next
      // message. End the Pattern.
      return false;
    }

    // Trim spaces trailing on every line of text.
    function trim(text) {
      return text.replace(RE_TRAILING_SPACES, "");
    }
  }
}
