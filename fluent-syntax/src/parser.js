/*  eslint no-magic-numbers: [0]  */

import * as AST from "./ast";
import { EOF, EOL, FluentParserStream } from "./stream";
import { ParseError } from "./errors";


const trailingWSRe = /[ \t\n\r]+$/;
// The Fluent Syntax spec uses /.*/ to parse comment lines. It matches all
// characters except the following ones, which are considered line endings by
// the regex engine.
const COMMENT_EOL = ["\n", "\r", "\u2028", "\u2029"];


function withSpan(fn) {
  return function(ps, ...args) {
    if (!this.withSpans) {
      return fn.call(this, ps, ...args);
    }

    const start = ps.index;
    const node = fn.call(this, ps, ...args);

    // Don't re-add the span if the node already has it.  This may happen when
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
      "getVariant", "getNumber", "getValue", "getPattern", "getVariantList",
      "getTextElement", "getPlaceable", "getExpression",
      "getSelectorExpression", "getCallArg", "getString", "getLiteral"
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

      if (!COMMENT_EOL.includes(ps.currentChar)) {
        ps.expectChar(" ");
        let ch;
        while ((ch = ps.takeChar(x => !COMMENT_EOL.includes(x)))) {
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

    const value = this.getInlineOrBlock(ps, this.getPattern);
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

    const value = this.getInlineOrBlock(ps, this.getValue);
    if (value === null) {
      throw new ParseError("E0006", id.name);
    }

    const attrs = this.getAttributes(ps);
    return new AST.Term(id, value, attrs);
  }

  getInlineOrBlock(ps, method) {
    ps.peekBlankInline();
    if (ps.isValueStart()) {
      ps.skipToPeek();
      return method.call(this, ps, {isBlock: false});
    }

    ps.peekBlankBlock();
    if (ps.isValueContinuation()) {
      ps.skipToPeek();
      return method.call(this, ps, {isBlock: true});
    }

    return null;
  }

  getAttribute(ps) {
    ps.expectChar(".");

    const key = this.getIdentifier(ps);

    ps.skipBlankInline();
    ps.expectChar("=");

    const value = this.getInlineOrBlock(ps, this.getPattern);
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

  getVariant(ps, hasDefault) {
    let defaultIndex = false;

    if (ps.currentChar === "*") {
      if (hasDefault) {
        throw new ParseError("E0015");
      }
      ps.next();
      defaultIndex = true;
      hasDefault = true;
    }

    ps.expectChar("[");

    ps.skipBlank();

    const key = this.getVariantKey(ps);

    ps.skipBlank();
    ps.expectChar("]");

    const value = this.getInlineOrBlock(ps, this.getValue);
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
      const variant = this.getVariant(ps, hasDefault);

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

  getValue(ps, {isBlock}) {
    ps.peekBlankInline();
    const peekOffset = ps.peekOffset;
    if (ps.currentPeek === "{") {
      ps.peek();
      ps.peekBlank();
      if (ps.isVariantStart()) {
        ps.resetPeek(peekOffset);
        ps.skipToPeek();
        return this.getVariantList(ps);
      }
    }

    ps.resetPeek();
    return this.getPattern(ps, {isBlock});
  }

  getVariantList(ps) {
    ps.expectChar("{");
    ps.skipBlankInline();
    ps.expectLineEnd();
    const variants = this.getVariants(ps);
    ps.skipBlank();
    ps.expectChar("}");
    return new AST.VariantList(variants);
  }

  getPattern(ps, {isBlock}) {
    const elements = [];
    if (isBlock) {
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

    return new AST.Pattern(this.dedent(elements, commonIndentLength));
  }

  getIndent(ps, value, start) {
    return {
      type: "Indent",
      span: {start, end: ps.index},
      value,
    };
  }

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
        const textElement = new AST.TextElement(element.value);
        if (this.withSpans) {
          textElement.addSpan(element.span.start, element.span.end);
        }
        element = textElement;
      }

      trimmed.push(element);
    }

    // Trim trailing whitespace.
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

    if (next === "\\" || next === "\"") {
      ps.next();
      return `\\${next}`;
    }

    if (next === "u") {
      let sequence = "";
      ps.next();

      for (let i = 0; i < 4; i++) {
        const ch = ps.takeHexDigit();

        if (!ch) {
          throw new ParseError("E0026", sequence + ps.currentChar);
        }

        sequence += ch;
      }

      return `\\u${sequence}`;
    }

    throw new ParseError("E0025", next);
  }

  getPlaceable(ps) {
    ps.expectChar("{");
    const expression = this.getExpression(ps);
    ps.expectChar("}");
    return new AST.Placeable(expression);
  }

  getExpression(ps) {
    ps.skipBlank();

    const selector = this.getSelectorExpression(ps);

    ps.skipBlank();

    if (ps.currentChar === "-") {

      if (ps.peek() !== ">") {
        ps.resetPeek();
        return selector;
      }

      if (selector.type === "MessageReference") {
        throw new ParseError("E0016");
      }

      if (selector.type === "AttributeExpression" &&
          selector.ref.type === "MessageReference") {
        throw new ParseError("E0018");
      }

      if (selector.type === "VariantExpression") {
        throw new ParseError("E0017");
      }

      ps.next();
      ps.next();

      ps.skipBlankInline();
      ps.expectLineEnd();

      const variants = this.getVariants(ps);

      // VariantLists are only allowed in other VariantLists.
      if (variants.some(v => v.value.type === "VariantList")) {
        throw new ParseError("E0023");
      }

      return new AST.SelectExpression(selector, variants);
    } else if (selector.type === "AttributeExpression" &&
               selector.ref.type === "TermReference") {
      throw new ParseError("E0019");
    }

    ps.skipBlank();

    return selector;
  }

  getSelectorExpression(ps) {
    if (ps.currentChar === "{") {
      return this.getPlaceable(ps);
    }

    const literal = this.getLiteral(ps);

    if (literal.type !== "MessageReference"
      && literal.type !== "TermReference") {
      return literal;
    }

    const ch = ps.currentChar;

    if (ch === ".") {
      ps.next();

      const attr = this.getIdentifier(ps);
      return new AST.AttributeExpression(literal, attr);
    }

    if (ch === "[") {
      ps.next();

      if (literal.type === "MessageReference") {
        throw new ParseError("E0024");
      }

      const key = this.getVariantKey(ps);

      ps.expectChar("]");

      return new AST.VariantExpression(literal, key);
    }

    if (ch === "(") {
      ps.next();

      if (!/^[A-Z][A-Z_?-]*$/.test(literal.id.name)) {
        throw new ParseError("E0008");
      }

      const args = this.getCallArgs(ps);

      ps.expectChar(")");

      const func = new AST.Function(literal.id.name);
      if (this.withSpans) {
        func.addSpan(literal.span.start, literal.span.end);
      }

      return new AST.CallExpression(
        func,
        args.positional,
        args.named,
      );
    }

    return literal;
  }

  getCallArg(ps) {
    const exp = this.getSelectorExpression(ps);

    ps.skipBlank();

    if (ps.currentChar !== ":") {
      return exp;
    }

    if (exp.type !== "MessageReference") {
      throw new ParseError("E0009");
    }

    ps.next();
    ps.skipBlank();

    const val = this.getArgVal(ps);

    return new AST.NamedArgument(exp.id, val);
  }

  getCallArgs(ps) {
    const positional = [];
    const named = [];
    const argumentNames = new Set();

    ps.skipBlank();

    while (true) {
      if (ps.currentChar === ")") {
        break;
      }

      const arg = this.getCallArg(ps);
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
      } else {
        break;
      }
    }
    return {
      positional,
      named
    };
  }

  getArgVal(ps) {
    if (ps.isNumberStart()) {
      return this.getNumber(ps);
    } else if (ps.currentChar === '"') {
      return this.getString(ps);
    }
    throw new ParseError("E0012");
  }

  getString(ps) {
    let val = "";

    ps.expectChar("\"");

    let ch;
    while ((ch = ps.takeChar(x => x !== '"' && x !== EOL))) {
      if (ch === "\\") {
        val += this.getEscapeSequence(ps);
      } else {
        val += ch;
      }
    }

    if (ps.currentChar === EOL) {
      throw new ParseError("E0020");
    }

    ps.expectChar("\"");

    return new AST.StringLiteral(val);

  }

  getLiteral(ps) {
    const ch = ps.currentChar;

    if (ch === EOF) {
      throw new ParseError("E0014");
    }

    if (ch === "$") {
      ps.next();
      const id = this.getIdentifier(ps);
      return new AST.VariableReference(id);
    }

    if (ps.isIdentifierStart()) {
      const id = this.getIdentifier(ps);
      return new AST.MessageReference(id);
    }

    if (ps.isNumberStart()) {
      return this.getNumber(ps);
    }

    if (ch === "-") {
      ps.next();
      const id = this.getIdentifier(ps);
      return new AST.TermReference(id);
    }

    if (ch === '"') {
      return this.getString(ps);
    }

    throw new ParseError("E0014");
  }
}
