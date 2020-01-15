import {
  Message,
  PatternElement,
  Literal,
  SelectExpression,
  Variant,
  NamedArgument,
  Expression,
  Pattern,
  VariableReference,
  TermReference,
  FunctionReference,
  MessageReference,
  Term,
  ComplexPattern,
  NumberLiteral,
  StringLiteral
} from "./ast.js";

// This regex is used to iterate through the beginnings of messages and terms.
// With the /m flag, the ^ matches at the beginning of every line.
const RE_MESSAGE_START = /^(-?[a-zA-Z][\w-]*) *= */gm;

// Both Attributes and Variants are parsed in while loops. These regexes are
// used to break out of them.
const RE_ATTRIBUTE_START = /\.([a-zA-Z][\w-]*) *= */y;
const RE_VARIANT_START = /\*?\[/y;

const RE_NUMBER_LITERAL = /(-?[0-9]+(?:\.([0-9]+))?)/y;
const RE_IDENTIFIER = /([a-zA-Z][\w-]*)/y;
const RE_REFERENCE = /([$-])?([a-zA-Z][\w-]*)(?:\.([a-zA-Z][\w-]*))?/y;
const RE_FUNCTION_NAME = /^[A-Z][A-Z0-9_-]*$/;

// A "run" is a sequence of text or string literal characters which don't
// require any special handling. For TextElements such special characters are: {
// (starts a placeable), and line breaks which require additional logic to check
// if the next line is indented. For StringLiterals they are: \ (starts an
// escape sequence), " (ends the literal), and line breaks which are not allowed
// in StringLiterals. Note that string runs may be empty; text runs may not.
const RE_TEXT_RUN = /([^{}\n\r]+)/y;
const RE_STRING_RUN = /([^\\"\n\r]*)/y;

// Escape sequences.
const RE_STRING_ESCAPE = /\\([\\"])/y;
const RE_UNICODE_ESCAPE = /\\u([a-fA-F0-9]{4})|\\U([a-fA-F0-9]{6})/y;

// Used for trimming TextElements and indents.
const RE_LEADING_NEWLINES = /^\n+/;
const RE_TRAILING_SPACES = / +$/;
// Used in makeIndent to strip spaces from blank lines and normalize CRLF to LF.
const RE_BLANK_LINES = / *\r?\n/g;
// Used in makeIndent to measure the indentation.
const RE_INDENT = /( *)$/;

// Common tokens.
const TOKEN_BRACE_OPEN = /{\s*/y;
const TOKEN_BRACE_CLOSE = /\s*}/y;
const TOKEN_BRACKET_OPEN = /\[\s*/y;
const TOKEN_BRACKET_CLOSE = /\s*] */y;
const TOKEN_PAREN_OPEN = /\s*\(\s*/y;
const TOKEN_ARROW = /\s*->\s*/y;
const TOKEN_COLON = /\s*:\s*/y;
// Note the optional comma. As a deviation from the Fluent EBNF, the parser
// doesn't enforce commas between call arguments.
const TOKEN_COMMA = /\s*,?\s*/y;
const TOKEN_BLANK = /\s+/y;

/**
 * Fluent Resource is a structure storing parsed localization entries.
 */
export class FluentResource {
  public body: Array<Message | Term>;

  constructor(source: string) {
    this.body = [];

    RE_MESSAGE_START.lastIndex = 0;
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
        this.body.push(parseMessage(next[1]));
      } catch (err) {
        if (err instanceof SyntaxError) {
          // Don't report any Fluent syntax errors. Skip directly to the
          // beginning of the next message or term.
          continue;
        }
        throw err;
      }
    }

    // The parser implementation is inlined below for performance reasons,
    // as well as for convenience of accessing `source` and `cursor`.

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

    function test(re: RegExp): boolean {
      re.lastIndex = cursor;
      return re.test(source);
    }

    // Advance the cursor by the char if it matches. May be used as a predicate
    // (was the match found?) or, if errorClass is passed, as an assertion.
    function consumeChar(
      char: string,
      errorClass?: typeof SyntaxError
    ): boolean {
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
    function consumeToken(
      re: RegExp,
      errorClass?: typeof SyntaxError
    ): boolean {
      if (test(re)) {
        cursor = re.lastIndex;
        return true;
      }
      if (errorClass) {
        throw new errorClass(`Expected ${re.toString()}`);
      }
      return false;
    }

    // Execute a regex, advance the cursor, and return all capture groups.
    function match(re: RegExp): RegExpExecArray {
      re.lastIndex = cursor;
      let result = re.exec(source);
      if (result === null) {
        throw new SyntaxError(`Expected ${re.toString()}`);
      }
      cursor = re.lastIndex;
      return result;
    }

    // Execute a regex, advance the cursor, and return the capture group.
    function match1(re: RegExp): string {
      return match(re)[1];
    }

    function parseMessage(id: string): Message {
      let value = parsePattern();
      let attributes = parseAttributes();

      if (value === null && Object.keys(attributes).length === 0) {
        throw new SyntaxError("Expected message value or attributes");
      }

      return { id, value, attributes };
    }

    function parseAttributes(): Record<string, Pattern> {
      let attrs: Record<string, Pattern> = Object.create(null);

      while (test(RE_ATTRIBUTE_START)) {
        let name = match1(RE_ATTRIBUTE_START);
        let value = parsePattern();
        if (value === null) {
          throw new SyntaxError("Expected attribute value");
        }
        attrs[name] = value;
      }

      return attrs;
    }

    function parsePattern(): Pattern | null {
      let first;
      // First try to parse any simple text on the same line as the id.
      if (test(RE_TEXT_RUN)) {
        first = match1(RE_TEXT_RUN);
      }

      // If there's a placeable on the first line, parse a complex pattern.
      if (source[cursor] === "{" || source[cursor] === "}") {
        // Re-use the text parsed above, if possible.
        return parsePatternElements(first ? [first] : [], Infinity);
      }

      // RE_TEXT_VALUE stops at newlines. Only continue parsing the pattern if
      // what comes after the newline is indented.
      let indent = parseIndent();
      if (indent) {
        if (first) {
          // If there's text on the first line, the blank block is part of the
          // translation content in its entirety.
          return parsePatternElements([first, indent], indent.length);
        }
        // Otherwise, we're dealing with a block pattern, i.e. a pattern which
        // starts on a new line. Discrad the leading newlines but keep the
        // inline indent; it will be used by the dedentation logic.
        indent.value = trim(indent.value, RE_LEADING_NEWLINES);
        return parsePatternElements([indent], indent.length);
      }

      if (first) {
        // It was just a simple inline text after all.
        return trim(first, RE_TRAILING_SPACES);
      }

      return null;
    }

    // Parse a complex pattern as an array of elements.
    function parsePatternElements(
      elements: Array<PatternElement | Indent> = [],
      commonIndent: number
    ): ComplexPattern {
      while (true) {
        if (test(RE_TEXT_RUN)) {
          elements.push(match1(RE_TEXT_RUN));
          continue;
        }

        if (source[cursor] === "{") {
          elements.push(parsePlaceable());
          continue;
        }

        if (source[cursor] === "}") {
          throw new SyntaxError("Unbalanced closing brace");
        }

        let indent = parseIndent();
        if (indent) {
          elements.push(indent);
          commonIndent = Math.min(commonIndent, indent.length);
          continue;
        }

        break;
      }

      let lastIndex = elements.length - 1;
      let lastElement = elements[lastIndex];
      // Trim the trailing spaces in the last element if it's a TextElement.
      if (typeof lastElement === "string") {
        elements[lastIndex] = trim(lastElement, RE_TRAILING_SPACES);
      }

      let baked: Array<PatternElement> = [];
      for (let element of elements) {
        if (element instanceof Indent) {
          // Dedent indented lines by the maximum common indent.
          element = element.value.slice(0, element.value.length - commonIndent);
        }
        if (element) {
          baked.push(element);
        }
      }
      return baked;
    }

    function parsePlaceable(): Expression {
      consumeToken(TOKEN_BRACE_OPEN, SyntaxError);

      let selector = parseInlineExpression();
      if (consumeToken(TOKEN_BRACE_CLOSE)) {
        return selector;
      }

      if (consumeToken(TOKEN_ARROW)) {
        let variants = parseVariants();
        consumeToken(TOKEN_BRACE_CLOSE, SyntaxError);
        return {
          type: "select",
          selector,
          ...variants
        } as SelectExpression;
      }

      throw new SyntaxError("Unclosed placeable");
    }

    function parseInlineExpression(): Expression {
      if (source[cursor] === "{") {
        // It's a nested placeable.
        return parsePlaceable();
      }

      if (test(RE_REFERENCE)) {
        let [, sigil, name, attr = null] = match(RE_REFERENCE);

        if (sigil === "$") {
          return { type: "var", name } as VariableReference;
        }

        if (consumeToken(TOKEN_PAREN_OPEN)) {
          let args = parseArguments();

          if (sigil === "-") {
            // A parameterized term: -term(...).
            return { type: "term", name, attr, args } as TermReference;
          }

          if (RE_FUNCTION_NAME.test(name)) {
            return { type: "func", name, args } as FunctionReference;
          }

          throw new SyntaxError("Function names must be all upper-case");
        }

        if (sigil === "-") {
          // A non-parameterized term: -term.
          return {
            type: "term",
            name,
            attr,
            args: []
          } as TermReference;
        }

        return { type: "mesg", name, attr } as MessageReference;
      }

      return parseLiteral();
    }

    function parseArguments(): Array<Expression | NamedArgument> {
      let args: Array<Expression | NamedArgument> = [];
      while (true) {
        switch (source[cursor]) {
          case ")": // End of the argument list.
            cursor++;
            return args;
          case undefined: // EOF
            throw new SyntaxError("Unclosed argument list");
        }

        args.push(parseArgument());
        // Commas between arguments are treated as whitespace.
        consumeToken(TOKEN_COMMA);
      }
    }

    function parseArgument(): Expression | NamedArgument {
      let expr = parseInlineExpression();
      if (expr.type !== "mesg") {
        return expr;
      }

      if (consumeToken(TOKEN_COLON)) {
        // The reference is the beginning of a named argument.
        return {
          type: "narg",
          name: expr.name,
          value: parseLiteral()
        } as NamedArgument;
      }

      // It's a regular message reference.
      return expr;
    }

    function parseVariants(): {
      variants: Array<Variant>;
      star: number;
    } | null {
      let variants: Array<Variant> = [];
      let count = 0;
      let star;

      while (test(RE_VARIANT_START)) {
        if (consumeChar("*")) {
          star = count;
        }

        let key = parseVariantKey();
        let value = parsePattern();
        if (value === null) {
          throw new SyntaxError("Expected variant value");
        }
        variants[count++] = { key, value };
      }

      if (count === 0) {
        return null;
      }

      if (star === undefined) {
        throw new SyntaxError("Expected default variant");
      }

      return { variants, star };
    }

    function parseVariantKey(): Literal {
      consumeToken(TOKEN_BRACKET_OPEN, SyntaxError);
      let key;
      if (test(RE_NUMBER_LITERAL)) {
        key = parseNumberLiteral();
      } else {
        key = {
          type: "str",
          value: match1(RE_IDENTIFIER)
        } as StringLiteral;
      }
      consumeToken(TOKEN_BRACKET_CLOSE, SyntaxError);
      return key;
    }

    function parseLiteral(): Literal {
      if (test(RE_NUMBER_LITERAL)) {
        return parseNumberLiteral();
      }

      if (source[cursor] === '"') {
        return parseStringLiteral();
      }

      throw new SyntaxError("Invalid expression");
    }

    function parseNumberLiteral(): NumberLiteral {
      let [, value, fraction = ""] = match(RE_NUMBER_LITERAL);
      let precision = fraction.length;
      return {
        type: "num",
        value: parseFloat(value),
        precision
      } as NumberLiteral;
    }

    function parseStringLiteral(): StringLiteral {
      consumeChar('"', SyntaxError);
      let value = "";
      while (true) {
        value += match1(RE_STRING_RUN);

        if (source[cursor] === "\\") {
          value += parseEscapeSequence();
          continue;
        }

        if (consumeChar('"')) {
          return { type: "str", value } as StringLiteral;
        }

        // We've reached an EOL of EOF.
        throw new SyntaxError("Unclosed string literal");
      }
    }

    // Unescape known escape sequences.
    function parseEscapeSequence(): string {
      if (test(RE_STRING_ESCAPE)) {
        return match1(RE_STRING_ESCAPE);
      }

      if (test(RE_UNICODE_ESCAPE)) {
        let [, codepoint4, codepoint6] = match(RE_UNICODE_ESCAPE);
        let codepoint = parseInt(codepoint4 || codepoint6, 16);
        return codepoint <= 0xd7ff || 0xe000 <= codepoint
          // It's a Unicode scalar value.
          ? String.fromCodePoint(codepoint)
          // Lonely surrogates can cause trouble when the parsing result is
          // saved using UTF-8. Use U+FFFD REPLACEMENT CHARACTER instead.
          : "�";
      }

      throw new SyntaxError("Unknown escape sequence");
    }

    // Parse blank space. Return it if it looks like indent before a pattern
    // line. Skip it othwerwise.
    function parseIndent(): Indent | false {
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
          return makeIndent(source.slice(start, cursor));
      }

      // If the first character on the line is not one of the special characters
      // listed above, it's a regular text character. Check if there's at least
      // one space of indent before it.
      if (source[cursor - 1] === " ") {
        // It's an indented text character (in EBNF: indented-char). Continue
        // the Pattern.
        return makeIndent(source.slice(start, cursor));
      }

      // A not-indented text character is likely the identifier of the next
      // message. End the Pattern.
      return false;
    }

    // Trim blanks in text according to the given regex.
    function trim(text: string, re: RegExp): string {
      return text.replace(re, "");
    }

    // Normalize a blank block and extract the indent details.
    function makeIndent(blank: string): Indent {
      let value = blank.replace(RE_BLANK_LINES, "\n");
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      let length = RE_INDENT.exec(blank)![1].length;
      return new Indent(value, length);
    }
  }
}

class Indent {
  constructor(public value: string, public length: number) { }
}
