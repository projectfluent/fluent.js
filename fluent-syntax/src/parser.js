/*  eslint no-magic-numbers: [0]  */

import * as AST from "./ast";
import { EOF, EOL, FluentParserStream } from "./stream";
import { ParseError } from "./errors";


const trailingWSRe = /[ \t\n\r]+$/;


function withSpan(fn) {
  return function(ps, ...args) {
    if (!this.withSpans) {
      return fn.call(this, ps, ...args);
    }

    const start = ps.index;
    const node = fn.call(this, ps, ...args);

    // Don't re-add the span if the node already has it. This may happen when
    // one decorated function calls another decorated function.
    if (node.span) {
      return node;
    }

    const end = ps.index;
    node.addSpan(start, end);
    return node;
  };
}


export default class FluentParser {
  constructor({
    withSpans = true,
  } = {}) {
    this.withSpans = withSpans;

    // Poor man's decorators.
    const methodNames = [
      "getComment", "getMessage", "getTerm", "getAttribute", "getIdentifier",
      "getVariant", "getNumber", "getPattern", "getVariantList",
      "getTextElement", "getPlaceable", "getExpression",
      "getInlineExpression", "getCallArgument", "getString",
      "getSimpleExpression", "getLiteral"
    ];
    for (const name of methodNames) {
      this[name] = withSpan(this[name]);
    }
  }

  parse(source) {
    const ps = new FluentParserStream(source);
    ps.skipBlankBlock();

    const entries = [];
    let lastComment = null;

    while (ps.currentChar) {
      const entry = this.getEntryOrJunk(ps);
      const blankLines = ps.skipBlankBlock();

      // Regular Comments require special logic. Comments may be attached to
      // Messages or Terms if they are followed immediately by them. However
      // they should parse as standalone when they're followed by Junk.
      // Consequently, we only attach Comments once we know that the Message
      // or the Term parsed successfully.
      if (entry.type === "Comment"
          && blankLines.length === 0
          && ps.currentChar) {
        // Stash the comment and decide what to do with it in the next pass.
        lastComment = entry;
        continue;
      }

      if (lastComment) {
        if (entry.type === "Message" || entry.type === "Term") {
          entry.comment = lastComment;
          if (this.withSpans) {
            entry.span.start = entry.comment.span.start;
          }
        } else {
          entries.push(lastComment);
        }
        // In either case, the stashed comment has been dealt with; clear it.
        lastComment = null;
      }

      // No special logic for other types of entries.
      entries.push(entry);
    }

    const res = new AST.Resource(entries);

    if (this.withSpans) {
      res.addSpan(0, ps.index);
    }

    return res;
  }

  /*
   * Parse the first Message or Term in `source`.
   *
   * Skip all encountered comments and start parsing at the first Message or
   * Term start. Return Junk if the parsing is not successful.
   *
   * Preceding comments are ignored unless they contain syntax errors
   * themselves, in which case Junk for the invalid comment is returned.
   */
  parseEntry(source) {
    const ps = new FluentParserStream(source);
    ps.skipBlankBlock();

    while (ps.currentChar === "#") {
      const skipped = this.getEntryOrJunk(ps);
      if (skipped.type === "Junk") {
        // Don't skip Junk comments.
        return skipped;
      }
      ps.skipBlankBlock();
    }

    return this.getEntryOrJunk(ps);
  }

  getEntryOrJunk(ps) {
    const entryStartPos = ps.index;

    try {
      const entry = this.getEntry(ps);
      ps.expectLineEnd();
      return entry;
    } catch (err) {
      if (!(err instanceof ParseError)) {
        throw err;
      }

      let errorIndex = ps.index;
      ps.skipToNextEntryStart(entryStartPos);
      const nextEntryStart = ps.index;
      if (nextEntryStart < errorIndex) {
        // The position of the error must be inside of the Junk's span.
        errorIndex = nextEntryStart;
      }

      // Create a Junk instance
      const slice = ps.string.substring(entryStartPos, nextEntryStart);
      const junk = new AST.Junk(slice);
      if (this.withSpans) {
        junk.addSpan(entryStartPos, nextEntryStart);
      }
      const annot = new AST.Annotation(err.code, err.args, err.message);
      annot.addSpan(errorIndex, errorIndex);
      junk.addAnnotation(annot);
      return junk;
    }
  }

  getEntry(ps) {
    if (ps.currentChar === "#") {
      return this.getComment(ps);
    }

    if (ps.currentChar === "-") {
      return this.getTerm(ps);
    }

    if (ps.isIdentifierStart()) {
      return this.getMessage(ps);
    }

    throw new ParseError("E0002");
  }

  getComment(ps) {
    // 0 - comment
    // 1 - group comment
    // 2 - resource comment
    let level = -1;
    let content = "";

    while (true) {
      let i = -1;
      while (ps.currentChar === "#" && (i < (level === -1 ? 2 : level))) {
        ps.next();
        i++;
      }

      if (level === -1) {
        level = i;
      }

      if (ps.currentChar !== EOL) {
        ps.expectChar(" ");
        let ch;
        while ((ch = ps.takeChar(x => x !== EOL))) {
          content += ch;
        }
      }

      if (ps.isNextLineComment(level)) {
        content += ps.currentChar;
        ps.next();
      } else {
        break;
      }
    }

    let Comment;
    switch (level) {
      case 0:
        Comment = AST.Comment;
        break;
      case 1:
        Comment = AST.GroupComment;
        break;
      case 2:
        Comment = AST.ResourceComment;
        break;
    }
    return new Comment(content);
  }

  getMessage(ps) {
    const id = this.getIdentifier(ps);

    ps.skipBlankInline();
    ps.expectChar("=");

    const value = this.maybeGetPattern(ps);
    const attrs = this.getAttributes(ps);

    if (value === null && attrs.length === 0) {
      throw new ParseError("E0005", id.name);
    }

    return new AST.Message(id, value, attrs);
  }

  getTerm(ps) {
    ps.expectChar("-");
    const id = this.getIdentifier(ps);

    ps.skipBlankInline();
    ps.expectChar("=");

    // Syntax 0.8 compat: VariantLists are supported but deprecated. They can
    // only be found as values of Terms. Nested VariantLists are not allowed.
    const value = this.maybeGetVariantList(ps) || this.maybeGetPattern(ps);
    if (value === null) {
      throw new ParseError("E0006", id.name);
    }

    const attrs = this.getAttributes(ps);
    return new AST.Term(id, value, attrs);
  }

  getAttribute(ps) {
    ps.expectChar(".");

    const key = this.getIdentifier(ps);

    ps.skipBlankInline();
    ps.expectChar("=");

    const value = this.maybeGetPattern(ps);
    if (value === null) {
      throw new ParseError("E0012");
    }

    return new AST.Attribute(key, value);
  }

  getAttributes(ps) {
    const attrs = [];
    ps.peekBlank();
    while (ps.isAttributeStart()) {
      ps.skipToPeek();
      const attr = this.getAttribute(ps);
      attrs.push(attr);
      ps.peekBlank();
    }
    return attrs;
  }

  getIdentifier(ps) {
    let name = ps.takeIDStart();

    let ch;
    while ((ch = ps.takeIDChar())) {
      name += ch;
    }

    return new AST.Identifier(name);
  }

  getVariantKey(ps) {
    const ch = ps.currentChar;

    if (ch === EOF) {
      throw new ParseError("E0013");
    }

    const cc = ch.charCodeAt(0);

    if ((cc >= 48 && cc <= 57) || cc === 45) { // 0-9, -
      return this.getNumber(ps);
    }

    return this.getIdentifier(ps);
  }

  getVariant(ps, {hasDefault}) {
    let defaultIndex = false;

    if (ps.currentChar === "*") {
      if (hasDefault) {
        throw new ParseError("E0015");
      }
      ps.next();
      defaultIndex = true;
    }

    ps.expectChar("[");

    ps.skipBlank();

    const key = this.getVariantKey(ps);

    ps.skipBlank();
    ps.expectChar("]");

    const value = this.maybeGetPattern(ps);
    if (value === null) {
      throw new ParseError("E0012");
    }

    return new AST.Variant(key, value, defaultIndex);
  }

  getVariants(ps) {
    const variants = [];
    let hasDefault = false;

    ps.skipBlank();
    while (ps.isVariantStart()) {
      const variant = this.getVariant(ps, {hasDefault});

      if (variant.default) {
        hasDefault = true;
      }

      variants.push(variant);
      ps.expectLineEnd();
      ps.skipBlank();
    }

    if (variants.length === 0) {
      throw new ParseError("E0011");
    }

    if (!hasDefault) {
      throw new ParseError("E0010");
    }

    return variants;
  }

  getDigits(ps) {
    let num = "";

    let ch;
    while ((ch = ps.takeDigit())) {
      num += ch;
    }

    if (num.length === 0) {
      throw new ParseError("E0004", "0-9");
    }

    return num;
  }

  getNumber(ps) {
    let num = "";

    if (ps.currentChar === "-") {
      num += "-";
      ps.next();
    }

    num = `${num}${this.getDigits(ps)}`;

    if (ps.currentChar === ".") {
      num += ".";
      ps.next();
      num = `${num}${this.getDigits(ps)}`;
    }

    return new AST.NumberLiteral(num);
  }

  // maybeGetPattern distinguishes between patterns which start on the same line
  // as the identifier (a.k.a. inline signleline patterns and inline multiline
  // patterns) and patterns which start on a new line (a.k.a. block multiline
  // patterns). The distinction is important for the dedentation logic: the
  // indent of the first line of a block pattern must be taken into account when
  // calculating the maximum common indent.
  maybeGetPattern(ps) {
    ps.peekBlankInline();
    if (ps.isValueStart()) {
      ps.skipToPeek();
      return this.getPattern(ps, {isBlock: false});
    }

    ps.peekBlankBlock();
    if (ps.isValueContinuation()) {
      ps.skipToPeek();
      return this.getPattern(ps, {isBlock: true});
    }

    return null;
  }

  // Deprecated in Syntax 0.8. VariantLists are only allowed as values of Terms.
  // Values of Messages, Attributes and Variants must be Patterns. This method
  // is only used in getTerm.
  maybeGetVariantList(ps) {
    ps.peekBlank();
    if (ps.currentPeek === "{") {
      const start = ps.peekOffset;
      ps.peek();
      ps.peekBlankInline();
      if (ps.currentPeek === EOL) {
        ps.peekBlank();
        if (ps.isVariantStart()) {
          ps.resetPeek(start);
          ps.skipToPeek();
          return this.getVariantList(ps);
        }
      }
    }

    ps.resetPeek();
    return null;
  }

  getVariantList(ps) {
    ps.expectChar("{");
    var variants = this.getVariants(ps);
    ps.expectChar("}");
    return new AST.VariantList(variants);
  }

  getPattern(ps, {isBlock}) {
    const elements = [];
    if (isBlock) {
      // A block pattern is a pattern which starts on a new line. Store and
      // measure the indent of this first line for the dedentation logic.
      const blankStart = ps.index;
      const firstIndent = ps.skipBlankInline();
      elements.push(this.getIndent(ps, firstIndent, blankStart));
      var commonIndentLength = firstIndent.length;
    } else {
      var commonIndentLength = Infinity;
    }

    let ch;
    elements: while ((ch = ps.currentChar)) {
      switch (ch) {
        case EOL: {
          const blankStart = ps.index;
          const blankLines = ps.peekBlankBlock();
          if (ps.isValueContinuation()) {
            ps.skipToPeek();
            const indent = ps.skipBlankInline();
            commonIndentLength = Math.min(commonIndentLength, indent.length);
            elements.push(this.getIndent(ps, blankLines + indent, blankStart));
            continue elements;
          }

          // The end condition for getPattern's while loop is a newline
          // which is not followed by a valid pattern continuation.
          ps.resetPeek();
          break elements;
        }
        case "{":
          elements.push(this.getPlaceable(ps));
          continue elements;
        case "}":
          throw new ParseError("E0027");
        default:
          const element = this.getTextElement(ps);
          elements.push(element);
      }
    }

    const dedented = this.dedent(elements, commonIndentLength);
    return new AST.Pattern(dedented);
  }

  // Create a token representing an indent. It's not part of the AST and it will
  // be trimmed and merged into adjacent TextElements, or turned into a new
  // TextElement, if it's surrounded by two Placeables.
  getIndent(ps, value, start) {
    return {
      type: "Indent",
      span: {start, end: ps.index},
      value,
    };
  }

  // Dedent a list of elements by removing the maximum common indent from the
  // beginning of text lines. The common indent is calculated in getPattern.
  dedent(elements, commonIndent) {
    const trimmed = [];

    for (let element of elements) {
      if (element.type === "Placeable") {
        trimmed.push(element);
        continue;
      }

      if (element.type === "Indent") {
        // Strip common indent.
        element.value = element.value.slice(
          0, element.value.length - commonIndent);
        if (element.value.length === 0) {
          continue;
        }
      }

      let prev = trimmed[trimmed.length - 1];
      if (prev && prev.type === "TextElement") {
        // Join adjacent TextElements by replacing them with their sum.
        const sum = new AST.TextElement(prev.value + element.value);
        if (this.withSpans) {
          sum.addSpan(prev.span.start, element.span.end);
        }
        trimmed[trimmed.length - 1] = sum;
        continue;
      }

      if (element.type === "Indent") {
        // If the indent hasn't been merged into a preceding TextElement,
        // convert it into a new TextElement.
        const textElement = new AST.TextElement(element.value);
        if (this.withSpans) {
          textElement.addSpan(element.span.start, element.span.end);
        }
        element = textElement;
      }

      trimmed.push(element);
    }

    // Trim trailing whitespace from the Pattern.
    const lastElement = trimmed[trimmed.length - 1];
    if (lastElement.type === "TextElement") {
      lastElement.value = lastElement.value.replace(trailingWSRe, "");
      if (lastElement.value.length === 0) {
        trimmed.pop();
      }
    }

    return trimmed;
  }

  getTextElement(ps) {
    let buffer = "";

    let ch;
    while ((ch = ps.currentChar)) {
      if (ch === "{" || ch === "}") {
        return new AST.TextElement(buffer);
      }

      if (ch === EOL) {
        return new AST.TextElement(buffer);
      }

      buffer += ch;
      ps.next();
    }

    return new AST.TextElement(buffer);
  }

  getEscapeSequence(ps) {
    const next = ps.currentChar;

    switch (next) {
      case "\\":
      case "\"":
        ps.next();
        return [`\\${next}`, next];
      case "u":
        return this.getUnicodeEscapeSequence(ps, next, 4);
      case "U":
        return this.getUnicodeEscapeSequence(ps, next, 6);
      default:
        throw new ParseError("E0025", next);
    }
  }

  getUnicodeEscapeSequence(ps, u, digits) {
    ps.expectChar(u);

    let sequence = "";
    for (let i = 0; i < digits; i++) {
      const ch = ps.takeHexDigit();

      if (!ch) {
        throw new ParseError(
          "E0026", `\\${u}${sequence}${ps.currentChar}`);
      }

      sequence += ch;
    }

    const codepoint = parseInt(sequence, 16);
    const unescaped = codepoint <= 0xD7FF || 0xE000 <= codepoint
      // It's a Unicode scalar value.
      ? String.fromCodePoint(codepoint)
      // Escape sequences reresenting surrogate code points are well-formed
      // but invalid in Fluent. Replace them with U+FFFD REPLACEMENT
      // CHARACTER.
      : "�";
    return [`\\${u}${sequence}`, unescaped];
  }

  getPlaceable(ps) {
    ps.expectChar("{");
    ps.skipBlank();
    const expression = this.getExpression(ps);
    ps.expectChar("}");
    return new AST.Placeable(expression);
  }

  getExpression(ps) {
    const selector = this.getInlineExpression(ps);
    ps.skipBlank();

    if (ps.currentChar === "-") {
      if (ps.peek() !== ">") {
        ps.resetPeek();
        return selector;
      }

      if (selector.type === "MessageReference") {
        throw new ParseError("E0016");
      }

      if (selector.type === "AttributeExpression"
          && selector.ref.type === "MessageReference") {
        throw new ParseError("E0018");
      }

      if (selector.type === "TermReference"
          || selector.type === "VariantExpression") {
        throw new ParseError("E0017");
      }

      if (selector.type === "CallExpression"
          && selector.callee.type === "TermReference") {
        throw new ParseError("E0017");
      }

      ps.next();
      ps.next();

      ps.skipBlankInline();
      ps.expectLineEnd();

      const variants = this.getVariants(ps);
      return new AST.SelectExpression(selector, variants);
    }

    if (selector.type === "AttributeExpression"
        && selector.ref.type === "TermReference") {
      throw new ParseError("E0019");
    }

    if (selector.type === "CallExpression"
        && selector.callee.type === "AttributeExpression") {
      throw new ParseError("E0019");
    }

    return selector;
  }

  getInlineExpression(ps) {
    if (ps.currentChar === "{") {
      return this.getPlaceable(ps);
    }

    let expr = this.getSimpleExpression(ps);
    switch (expr.type) {
      case "NumberLiteral":
      case "StringLiteral":
      case "VariableReference":
        return expr;
      case "MessageReference": {
        if (ps.currentChar === ".") {
          ps.next();
          const attr = this.getIdentifier(ps);
          return new AST.AttributeExpression(expr, attr);
        }

        if (ps.currentChar === "(") {
          // It's a Function. Ensure it's all upper-case.
          if (!/^[A-Z][A-Z_?-]*$/.test(expr.id.name)) {
            throw new ParseError("E0008");
          }

          const func = new AST.FunctionReference(expr.id);
          if (this.withSpans) {
            func.addSpan(expr.span.start, expr.span.end);
          }
          return new AST.CallExpression(func, ...this.getCallArguments(ps));
        }

        return expr;
      }
      case "TermReference": {
        if (ps.currentChar === "[") {
          ps.next();
          const key = this.getVariantKey(ps);
          ps.expectChar("]");
          return new AST.VariantExpression(expr, key);
        }

        if (ps.currentChar === ".") {
          ps.next();
          const attr = this.getIdentifier(ps);
          expr = new AST.AttributeExpression(expr, attr);
        }

        if (ps.currentChar === "(") {
          return new AST.CallExpression(expr, ...this.getCallArguments(ps));
        }

        return expr;
      }
      default:
        throw new ParseError("E0028");
    }
  }

  getSimpleExpression(ps) {
    if (ps.isNumberStart()) {
      return this.getNumber(ps);
    }

    if (ps.currentChar === '"') {
      return this.getString(ps);
    }

    if (ps.currentChar === "$") {
      ps.next();
      const id = this.getIdentifier(ps);
      return new AST.VariableReference(id);
    }

    if (ps.currentChar === "-") {
      ps.next();
      const id = this.getIdentifier(ps);
      return new AST.TermReference(id);
    }

    if (ps.isIdentifierStart()) {
      const id = this.getIdentifier(ps);
      return new AST.MessageReference(id);
    }

    throw new ParseError("E0028");
  }

  getCallArgument(ps) {
    const exp = this.getInlineExpression(ps);

    ps.skipBlank();

    if (ps.currentChar !== ":") {
      return exp;
    }

    if (exp.type !== "MessageReference") {
      throw new ParseError("E0009");
    }

    ps.next();
    ps.skipBlank();

    const value = this.getLiteral(ps);
    return new AST.NamedArgument(exp.id, value);
  }

  getCallArguments(ps) {
    const positional = [];
    const named = [];
    const argumentNames = new Set();

    ps.expectChar("(");
    ps.skipBlank();

    while (true) {
      if (ps.currentChar === ")") {
        break;
      }

      const arg = this.getCallArgument(ps);
      if (arg.type === "NamedArgument") {
        if (argumentNames.has(arg.name.name)) {
          throw new ParseError("E0022");
        }
        named.push(arg);
        argumentNames.add(arg.name.name);
      } else if (argumentNames.size > 0) {
        throw new ParseError("E0021");
      } else {
        positional.push(arg);
      }

      ps.skipBlank();

      if (ps.currentChar === ",") {
        ps.next();
        ps.skipBlank();
        continue;
      }

      break;
    }

    ps.expectChar(")");
    return [positional, named];
  }

  getString(ps) {
    let raw = "";
    let value = "";

    ps.expectChar("\"");

    let ch;
    while ((ch = ps.takeChar(x => x !== '"' && x !== EOL))) {
      if (ch === "\\") {
        const [sequence, unescaped] = this.getEscapeSequence(ps);
        raw += sequence;
        value += unescaped;
      } else {
        raw += ch;
        value += ch;
      }
    }

    if (ps.currentChar === EOL) {
      throw new ParseError("E0020");
    }

    ps.expectChar("\"");

    return new AST.StringLiteral(raw, value);
  }

  getLiteral(ps) {
    if (ps.isNumberStart()) {
      return this.getNumber(ps);
    }

    if (ps.currentChar === '"') {
      return this.getString(ps);
    }

    throw new ParseError("E0014");
  }
}
