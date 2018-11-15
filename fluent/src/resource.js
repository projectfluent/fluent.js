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
// require any special handling. For TextElements such special characters are: {
// (starts a placeable), and line breaks which require additional logic to check
// if the next line is indented. For StringLiterals they are: \ (starts an
// escape sequence), " (ends the literal), and line breaks which are not allowed
// in StringLiterals. Note that string runs may be empty; text runs may not.
const RE_TEXT_RUN = /([^{\n\r]+)/y;
const RE_STRING_RUN = /([^\\"\n\r]*)/y;

// Escape sequences.
const RE_UNICODE_ESCAPE = /\\u([a-fA-F0-9]{4})/y;
const RE_STRING_ESCAPE = /\\([\\"])/y;

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
// Note the optional comma. As a deviation from the Fluent EBNF, the parser
// doesn't enforce commas between call arguments.
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

    // Advance the cursor by the char if it matches. May be used as a predicate
    // (was the match found?) or, if errorClass is passed, as an assertion.
    function consumeChar(char, errorClass) {
      if (source[cursor] === char) {
        cursor++;
        return true;
      }
      if (errorClass) {
        throw new errorClass(`Expected ${char}`);
      }
      return false;
    }

    // Advance the cursor by the token if it matches. May be used as a predicate
    // (was the match found?) or, if errorClass is passed, as an assertion.
    function consumeToken(re, errorClass) {
      if (test(re)) {
        cursor = re.lastIndex;
        return true;
      }
      if (errorClass) {
        throw new errorClass(`Expected ${re.toString()}`);
      }
      return false;
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

    function parseMessage() {
      let value = parsePattern();
      let attrs = parseAttributes();

      if (attrs === null) {
        if (value === null) {
          throw new FluentError("Expected message value or attributes");
        }
        return value;
      }

      return {value, attrs};
    }

    function parseAttributes() {
      let attrs = {};

      while (test(RE_ATTRIBUTE_START)) {
        let name = match(RE_ATTRIBUTE_START);
        let value = parsePattern();
        if (value === null) {
          throw new FluentError("Expected attribute value");
        }
        attrs[name] = value;
      }

      return Object.keys(attrs).length > 0 ? attrs : null;
    }

    function parsePattern() {
      // First try to parse any simple text on the same line as the id.
      if (test(RE_TEXT_RUN)) {
        var first = match(RE_TEXT_RUN);
      }

      // If there's a placeable on the first line, parse a complex pattern.
      if (source[cursor] === "{") {
        return first
          // Re-use the text parsed above, if possible.
          ? parsePatternElements(first)
          : parsePatternElements();
      }

      // RE_TEXT_VALUE stops at newlines. Only continue parsing the pattern if
      // what comes after the newline is indented.
      let indent = parseIndent();
      if (indent) {
        return first
          // If there's text on the first line, the blank block is part of the
          // translation content.
          ? parsePatternElements(first, trim(indent))
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
        if (test(RE_TEXT_RUN)) {
          elements.push(match(RE_TEXT_RUN));
          needsTrimming = true;
          continue;
        }

        if (source[cursor] === "{") {
          if (++placeableCount > MAX_PLACEABLES) {
            throw new FluentError("Too many placeables");
          }
          elements.push(parsePlaceable());
          needsTrimming = false;
          continue;
        }

        let indent = parseIndent();
        if (indent) {
          elements.push(trim(indent));
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
      consumeToken(TOKEN_BRACE_OPEN, FluentError);

      // VariantLists are parsed as selector-less SelectExpressions.
      let onlyVariants = parseVariants();
      if (onlyVariants) {
        consumeToken(TOKEN_BRACE_CLOSE, FluentError);
        return {type: "select", selector: null, ...onlyVariants};
      }

      let selector = parseInlineExpression();
      if (consumeToken(TOKEN_BRACE_CLOSE)) {
        return selector;
      }

      if (consumeToken(TOKEN_ARROW)) {
        let variants = parseVariants();
        consumeToken(TOKEN_BRACE_CLOSE, FluentError);
        return {type: "select", selector, ...variants};
      }

      throw new FluentError("Unclosed placeable");
    }

    function parseInlineExpression() {
      if (source[cursor] === "{") {
        // It's a nested placeable.
        return parsePlaceable();
      }

      if (consumeChar("$")) {
        return {type: "var", name: match(RE_IDENTIFIER)};
      }

      if (test(RE_IDENTIFIER)) {
        let ref = {type: "ref", name: match(RE_IDENTIFIER)};

        if (consumeChar(".")) {
          let name = match(RE_IDENTIFIER);
          return {type: "getattr", ref, name};
        }

        if (source[cursor] === "[") {
          return {type: "getvar", ref, selector: parseVariantKey()};
        }

        if (consumeToken(TOKEN_PAREN_OPEN)) {
          let callee = {...ref, type: "func"};
          return {type: "call", callee, args: parseArguments()};
        }

        return ref;
      }

      return parseLiteral();
    }

    function parseArguments() {
      let args = [];
      while (true) {
        switch (source[cursor]) {
          case ")": // End of the argument list.
            cursor++;
            return args;
          case undefined: // EOF
            throw new FluentError("Unclosed argument list");
        }

        args.push(parseArgument());
        // Commas between arguments are treated as whitespace.
        consumeToken(TOKEN_COMMA);
      }
    }

    function parseArgument() {
      let ref = parseInlineExpression();
      if (ref.type !== "ref") {
        return ref;
      }

      if (consumeToken(TOKEN_COLON)) {
        // The reference is the beginning of a named argument.
        return {type: "narg", name: ref.name, value: parseLiteral()};
      }

      // It's a regular message reference.
      return ref;
    }

    function parseVariants() {
      let variants = [];
      let count = 0;
      let star;

      while (test(RE_VARIANT_START)) {
        if (consumeChar("*")) {
          star = count;
        }

        let key = parseVariantKey();
        cursor = RE_VARIANT_START.lastIndex;
        let value = parsePattern();
        if (value === null) {
          throw new FluentError("Expected variant value");
        }
        variants[count++] = {key, value};
      }

      return count > 0 ? {variants, star} : null;
    }

    function parseVariantKey() {
      consumeToken(TOKEN_BRACKET_OPEN, FluentError);
      let key = test(RE_NUMBER_LITERAL)
        ? parseNumberLiteral()
        : match(RE_IDENTIFIER);
      consumeToken(TOKEN_BRACKET_CLOSE, FluentError);
      return key;
    }

    function parseLiteral() {
      if (test(RE_NUMBER_LITERAL)) {
        return parseNumberLiteral();
      }

      if (source[cursor] === "\"") {
        return parseStringLiteral();
      }

      throw new FluentError("Invalid expression");
    }

    function parseNumberLiteral() {
      return {type: "num", value: match(RE_NUMBER_LITERAL)};
    }

    function parseStringLiteral() {
      consumeChar("\"", FluentError);
      let value = "";
      while (true) {
        value += match(RE_STRING_RUN);

        if (source[cursor] === "\\") {
          value += parseEscapeSequence();
          continue;
        }

        if (consumeChar("\"")) {
          return value;
        }

        // We've reached an EOL of EOF.
        throw new FluentError("Unclosed string literal");
      }
    }

    // Unescape known escape sequences.
    function parseEscapeSequence() {
      if (test(RE_UNICODE_ESCAPE)) {
        let sequence = match(RE_UNICODE_ESCAPE);
        let codepoint = parseInt(sequence, 16);
        return codepoint <= 0xD7FF || 0xE000 <= codepoint
          // It's a Unicode scalar value.
          ? String.fromCodePoint(codepoint)
          // Lonely surrogates can cause trouble when the parsing result is
          // saved using UTF-8. Use U+FFFD REPLACEMENT CHARACTER instead.
          : "�";
      }

      if (test(RE_STRING_ESCAPE)) {
        return match(RE_STRING_ESCAPE);
      }

      throw new FluentError("Unknown escape sequence");
    }

    // Parse blank space. Return it if it looks like indent before a pattern
    // line. Skip it othwerwise.
    function parseIndent() {
      let start = cursor;
      consumeToken(TOKEN_BLANK);

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
