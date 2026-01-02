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
  StringLiteral,
} from "./ast.js";

// This regex is used to iterate through the beginnings of messages and terms.
// With the /m flag, the ^ matches at the beginning of every line.
const RE_MESSAGE_START = /^(?<!\r)(-?[a-zA-Z][\w-]*) *= */gm;

// Both Attributes and Variants are parsed in while loops. These regexes are
// used to break out of them.
const RE_ATTRIBUTE_START = /(?<=\n *)\.([a-zA-Z][\w-]*) *= */y;
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
const RE_TEXT_RUN = /((?:[^{}\n\r]|\r(?!\n))+)/y;
const RE_STRING_RUN = /((?:[^\\"\n\r]|\r(?!\n))*)/y;

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
const TOKEN_BRACE_OPEN = /{(?: |\r?\n)*/y;
const TOKEN_BRACE_CLOSE = /(?: |\r?\n)*}/y;
const TOKEN_BRACKET_OPEN = /\[(?: |\r?\n)*/y;
const TOKEN_BRACKET_CLOSE = /(?: |\r?\n)*] */y;
const TOKEN_PAREN_OPEN = /(?: |\r?\n)*\((?: |\r?\n)*/y;
const TOKEN_ARROW = /(?: |\r?\n)*->(?: |\r?\n)*/y;
const TOKEN_COLON = /(?: |\r?\n)*:(?: |\r?\n)*/y;
// Note the optional comma. As a deviation from the Fluent EBNF, the parser
// doesn't enforce commas between call arguments.
const TOKEN_COMMA = /(?: |\r?\n)*,?(?: |\r?\n)*/y;
const TOKEN_BLANK = /(?: |\r?\n)+/y;

/**
 * Fluent Resource is a structure storing parsed localization entries.
 */
export class FluentResource {
  /** @ignore */
  public body: Array<Message | Term>;

  constructor(source: string) {
    this.body = [];

    RE_MESSAGE_START.lastIndex = 0;

    // Iterate over the beginnings of messages and terms to efficiently skip
    // comments and recover from errors.
    while (true) {
      let next = RE_MESSAGE_START.exec(source);
      if (next === null) {
        break;
      }

      const cursor = RE_MESSAGE_START.lastIndex;
      try {
        this.body.push(parseMessage(source, cursor, next[1]));
      } catch (err) {
        if (err instanceof SyntaxError) {
          // Don't report any Fluent syntax errors. Skip directly to the
          // beginning of the next message or term.
          continue;
        }
        throw err;
      }
    }
  }
}

/**
 * The parser implementation is inlined within parseMessage() for performance reasons,
 * as well as for convenience of accessing `source` and `cursor`.
 *
 * The parser focuses on minimizing the number of false negatives
 * at the expense of increasing the risk of false positives.
 * In other words, it aims at parsing valid Fluent messages with a success rate of 100%,
 * but it may also parse a few invalid messages which the reference parser would reject.
 * The parser doesn't perform any validation and may produce entries which wouldn't make sense in the real world.
 * For best results users are advised to validate translations with the fluent-syntax parser pre-runtime.
 *
 * The parser makes an extensive use of sticky regexes which can be
 * anchored to any offset of the source string without slicing it.
 * Errors are thrown to bail out of parsing of ill-formed messages.
 */
function parseMessage(source: string, cursor: number, id: string): Message {
  /**
   * Advance the cursor by the char if it matches.
   * May be used as a predicate (was the match found?) or,
   * if errorClass is passed, as an assertion.
   */
  function consumeChar(
    char: string,
    errorClass?: typeof SyntaxError,
    errorMsg?: string
  ): boolean {
    if (source[cursor] === char) {
      cursor++;
      return true;
    }
    if (errorClass) {
      throw new errorClass(errorMsg ?? `Expected ${char}`);
    }
    return false;
  }

  /**
   * Advance the cursor by the token if it matches.
   * May be used as a predicate (was the match found?) or,
   * if errorClass is passed, as an assertion.
   */
  function consumeToken(re: RegExp, errorClass?: typeof SyntaxError): boolean {
    re.lastIndex = cursor;
    if (re.test(source)) {
      cursor = re.lastIndex;
      return true;
    }
    if (errorClass) {
      throw new errorClass(`Expected ${re.toString()}`);
    }
    return false;
  }

  /** Execute a regex, advance the cursor, and return all capture groups. */
  function match(re: RegExp, required: true): RegExpExecArray;
  function match(re: RegExp, required: false): RegExpExecArray | null;
  function match(re: RegExp, required: boolean): RegExpExecArray | null {
    re.lastIndex = cursor;
    let result = re.exec(source);
    if (result === null) {
      if (required) {
        throw new SyntaxError(`Expected ${re.toString()}`);
      } else {
        return null;
      }
    }
    cursor = re.lastIndex;
    return result;
  }

  function parsePattern(): Pattern | null {
    let first;
    // First try to parse any simple text on the same line as the id.
    const text = match(RE_TEXT_RUN, false);
    if (text) {
      first = text[1];
    }

    // If there's a placeable on the first line, parse a complex pattern.
    if (source[cursor] === "{" || source[cursor] === "}") {
      // Re-use the text parsed above, if possible.
      return parsePatternElements(first ? [first] : [], Infinity);
    }

    // RE_TEXT_VALUE stops at newlines. Only continue parsing the pattern if
    // what comes after the newline is indented.
    const indent = parseIndent();
    if (indent) {
      if (first) {
        // If there's text on the first line, the blank block is part of the
        // translation content in its entirety.
        return parsePatternElements([first, indent], indent.length);
      }
      // Otherwise, we're dealing with a block pattern, i.e. a pattern which
      // starts on a new line. Discrad the leading newlines but keep the
      // inline indent; it will be used by the dedentation logic.
      indent.value = indent.value.replace(RE_LEADING_NEWLINES, "");
      return parsePatternElements([indent], indent.length);
    }

    if (first) {
      // It was just a simple inline text after all.
      return first.replace(RE_TRAILING_SPACES, "");
    }

    return null;
  }

  // Parse a complex pattern as an array of elements.
  function parsePatternElements(
    elements: Array<PatternElement | Indent> = [],
    commonIndent: number
  ): ComplexPattern {
    while (true) {
      const text = match(RE_TEXT_RUN, false);
      if (text) {
        elements.push(text[1]);
        continue;
      }

      if (source[cursor] === "{") {
        elements.push(parsePlaceable());
        continue;
      }

      if (source[cursor] === "}") {
        throw new SyntaxError("Unbalanced closing brace");
      }

      const indent = parseIndent();
      if (indent) {
        elements.push(indent);
        commonIndent = Math.min(commonIndent, indent.length);
        continue;
      }

      break;
    }

    const lastIndex = elements.length - 1;
    const lastElement = elements[lastIndex];
    if (typeof lastElement === "string") {
      elements[lastIndex] = lastElement.replace(RE_TRAILING_SPACES, "");
    }

    const baked: PatternElement[] = [];
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

    const expression = parseInlineExpression();
    if (consumeToken(TOKEN_BRACE_CLOSE)) {
      return expression;
    }

    if (consumeToken(TOKEN_ARROW)) {
      let variants = parseVariants();
      consumeToken(TOKEN_BRACE_CLOSE, SyntaxError);
      return {
        type: "select",
        selector: expression,
        ...variants,
      } satisfies SelectExpression;
    }

    throw new SyntaxError("Unclosed placeable");
  }

  function parseInlineExpression(): Expression {
    if (source[cursor] === "{") {
      // It's a nested placeable.
      return parsePlaceable();
    }

    const ref = match(RE_REFERENCE, false);
    if (ref === null) {
      return parseLiteral();
    }

    const [, sigil, name, attr = null] = ref;

    if (sigil === "$") {
      return { type: "var", name } satisfies VariableReference;
    }

    if (consumeToken(TOKEN_PAREN_OPEN)) {
      let args = parseArguments();

      if (sigil === "-") {
        // A parameterized term: -term(...).
        return { type: "term", name, attr, args } satisfies TermReference;
      }

      if (RE_FUNCTION_NAME.test(name)) {
        return { type: "func", name, args } satisfies FunctionReference;
      }

      throw new SyntaxError("Function names must be all upper-case");
    }

    if (sigil === "-") {
      // A non-parameterized term: -term.
      return {
        type: "term",
        name,
        attr,
        args: [],
      } satisfies TermReference;
    }

    return { type: "mesg", name, attr } as MessageReference;
  }

  function parseArguments(): Array<Expression | NamedArgument> {
    const args: Array<Expression | NamedArgument> = [];
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
    const expr = parseInlineExpression();
    if (expr.type !== "mesg") {
      return expr;
    }

    if (consumeToken(TOKEN_COLON)) {
      // The reference is the beginning of a named argument.
      return {
        type: "narg",
        name: expr.name,
        value: parseLiteral(),
      } satisfies NamedArgument;
    }

    // It's a regular message reference.
    return expr;
  }

  function parseVariants(): {
    variants: Array<Variant>;
    star: number;
  } {
    const variants: Array<Variant> = [];
    let star;

    RE_VARIANT_START.lastIndex = cursor;
    while (RE_VARIANT_START.test(source)) {
      if (consumeChar("*")) {
        star = variants.length;
      }

      const key = parseVariantKey();
      const value = parsePattern();
      if (value === null) {
        throw new SyntaxError("Expected variant value");
      }
      variants.push({ key, value });
      RE_VARIANT_START.lastIndex = cursor;
    }

    if (star === undefined) {
      throw new SyntaxError("Expected default variant");
    }

    return { variants, star };
  }

  function parseVariantKey(): Literal {
    consumeToken(TOKEN_BRACKET_OPEN, SyntaxError);
    const key: Literal = parseNumberLiteral() ?? {
      type: "str",
      value: match(RE_IDENTIFIER, true)[1],
    };
    consumeToken(TOKEN_BRACKET_CLOSE, SyntaxError);
    return key;
  }

  function parseLiteral(): Literal {
    const num = parseNumberLiteral();
    if (num) {
      return num;
    }

    consumeChar('"', SyntaxError, "Invalid expression");
    let value = "";
    while (true) {
      value += match(RE_STRING_RUN, true)[1];
      if (source[cursor] === "\\") {
        value += parseEscapeSequence();
        continue;
      }
      consumeChar('"', SyntaxError, "Unclosed string literal");
      return { type: "str", value } satisfies StringLiteral;
    }
  }

  function parseNumberLiteral(): NumberLiteral | null {
    const num = match(RE_NUMBER_LITERAL, false);
    return num
      ? {
          type: "num",
          value: parseFloat(num[1]),
          precision: num[2]?.length ?? 0,
        }
      : null;
  }

  // Unescape known escape sequences.
  function parseEscapeSequence(): string {
    const strEsc = match(RE_STRING_ESCAPE, false);
    if (strEsc) {
      return strEsc[1];
    }

    const unicEsc = match(RE_UNICODE_ESCAPE, false);
    if (unicEsc === null) {
      throw new SyntaxError("Unknown escape sequence");
    }

    const codepoint = parseInt(unicEsc[1] || unicEsc[2], 16);
    return codepoint <= 0xd7ff || 0xe000 <= codepoint
      ? // It's a Unicode scalar value.
        String.fromCodePoint(codepoint)
      : // Lone surrogates can cause trouble when the parsing result is
        // saved using UTF-8. Use U+FFFD REPLACEMENT CHARACTER instead.
        "�";
  }

  // Parse blank space. Return it if it looks like indent before a pattern
  // line. Skip it othwerwise.
  function parseIndent(): Indent | false {
    const start = cursor;
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
        return new Indent(source.slice(start, cursor));
    }

    // If the first character on the line is not one of the special characters
    // listed above, it's a regular text character. Check if there's at least
    // one space of indent before it.
    if (source[cursor - 1] === " ") {
      // It's an indented text character (in EBNF: indented-char). Continue
      // the Pattern.
      return new Indent(source.slice(start, cursor));
    }

    // A not-indented text character is likely the identifier of the next
    // message. End the Pattern.
    return false;
  }

  const value = parsePattern();

  const attributes = Object.create(null) as Record<string, Pattern>;
  let hasAttributes = false;
  let attr;
  while ((attr = match(RE_ATTRIBUTE_START, false))) {
    const name = attr[1];
    const pattern = parsePattern();
    if (pattern === null) {
      throw new SyntaxError("Expected attribute value");
    }
    attributes[name] = pattern;
    hasAttributes ||= true;
  }

  if (value === null && !hasAttributes) {
    throw new SyntaxError("Expected message value or attributes");
  }

  return { id, value, attributes };
}

class Indent {
  value: string;
  length: number;

  // Normalize a blank block and extract the indent details.
  constructor(blank: string) {
    this.value = blank.replace(RE_BLANK_LINES, "\n");
    this.length = RE_INDENT.exec(blank)![1].length;
  }
}
