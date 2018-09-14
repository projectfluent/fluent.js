/*  eslint no-magic-numbers: [0]  */

import * as AST from "./ast";
import { FTLParserStream } from "./ftlstream";
import { ParseError } from "./errors";


const trailingWSRe = /[ \t\n\r]+$/;


function withSpan(fn) {
  return function(ps, ...args) {
    if (!this.withSpans) {
      return fn.call(this, ps, ...args);
    }

    const start = ps.getIndex();
    const node = fn.call(this, ps, ...args);

    // Don't re-add the span if the node already has it.  This may happen when
    // one decorated function calls another decorated function.
    if (node.span) {
      return node;
    }

    const end = ps.getIndex();
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
      "getTermIdentifier", "getVariant", "getNumber",
      "getValue", "getPattern", "getVariantList", "getTextElement",
      "getPlaceable", "getExpression", "getSelectorExpression", "getCallArg",
      "getString", "getLiteral"
    ];
    for (const name of methodNames) {
      this[name] = withSpan(this[name]);
    }
  }

  parse(source) {
    const ps = new FTLParserStream(source);
    ps.skipBlankBlock();

    const entries = [];
    let lastComment = null;

    while (ps.current()) {
      const entry = this.getEntryOrJunk(ps);
      const blankLines = ps.skipBlankBlock();

      // Regular Comments require special logic. Comments may be attached to
      // Messages or Terms if they are followed immediately by them. However
      // they should parse as standalone when they're followed by Junk.
      // Consequently, we only attach Comments once we know that the Message
      // or the Term parsed successfully.
      if (entry.type === "Comment" && blankLines === 0 && ps.current()) {
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
      res.addSpan(0, ps.getIndex());
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
    const ps = new FTLParserStream(source);
    ps.skipBlankBlock();

    while (ps.currentIs("#")) {
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
    const entryStartPos = ps.getIndex();

    try {
      const entry = this.getEntry(ps);
      ps.expectLineEnd();
      return entry;
    } catch (err) {
      if (!(err instanceof ParseError)) {
        throw err;
      }

      const errorIndex = ps.getIndex();
      ps.skipToNextEntryStart();
      const nextEntryStart = ps.getIndex();

      // Create a Junk instance
      const slice = ps.getSlice(entryStartPos, nextEntryStart);
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
    if (ps.currentIs("#")) {
      return this.getComment(ps);
    }

    if (ps.currentIs("-")) {
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
      while (ps.currentIs("#") && (i < (level === -1 ? 2 : level))) {
        ps.next();
        i++;
      }

      if (level === -1) {
        level = i;
      }

      if (!ps.currentIs("\n")) {
        ps.expectChar(" ");
        let ch;
        while ((ch = ps.takeChar(x => x !== "\n"))) {
          content += ch;
        }
      }

      if (ps.isPeekNextLineComment(level)) {
        content += ps.current();
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

    if (ps.isPeekValueStart()) {
      var pattern = this.getPattern(ps);
    }

    if (ps.isPeekNextLineAttributeStart()) {
      var attrs = this.getAttributes(ps);
    }

    if (pattern === undefined && attrs === undefined) {
      throw new ParseError("E0005", id.name);
    }

    return new AST.Message(id, pattern, attrs);
  }

  getTerm(ps) {
    const id = this.getTermIdentifier(ps);

    ps.skipBlankInline();
    ps.expectChar("=");

    if (ps.isPeekValueStart()) {
      ps.skipBlankInline();
      var value = this.getValue(ps);
    } else {
      throw new ParseError("E0006", id.name);
    }

    if (ps.isPeekNextLineAttributeStart()) {
      var attrs = this.getAttributes(ps);
    }

    return new AST.Term(id, value, attrs);
  }

  getAttribute(ps) {
    ps.expectChar(".");

    const key = this.getIdentifier(ps);

    ps.skipBlankInline();
    ps.expectChar("=");

    if (ps.isPeekValueStart()) {
      ps.skipBlankInline();
      const value = this.getPattern(ps);
      return new AST.Attribute(key, value);
    }

    throw new ParseError("E0012");
  }

  getAttributes(ps) {
    const attrs = [];

    while (true) {
      const attr = this.getAttribute(ps);
      attrs.push(attr);

      if (!ps.isPeekNextLineAttributeStart()) {
        break;
      }
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

  getTermIdentifier(ps) {
    ps.expectChar("-");
    const id = this.getIdentifier(ps);
    return new AST.Identifier(`-${id.name}`);

  }

  getVariantKey(ps) {
    const ch = ps.current();

    if (!ch) {
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

    if (ps.currentIs("*")) {
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

    if (ps.isPeekValueStart()) {
      ps.skipBlankInline();
      const value = this.getValue(ps);
      return new AST.Variant(key, value, defaultIndex);
    }

    throw new ParseError("E0012");
  }

  getVariants(ps) {
    const variants = [];
    let hasDefault = false;

    while (true) {
      const variant = this.getVariant(ps, hasDefault);

      if (variant.default) {
        hasDefault = true;
      }

      variants.push(variant);

      if (!ps.isPeekNextLineVariantStart()) {
        break;
      }
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

    if (ps.currentIs("-")) {
      num += "-";
      ps.next();
    }

    num = `${num}${this.getDigits(ps)}`;

    if (ps.currentIs(".")) {
      num += ".";
      ps.next();
      num = `${num}${this.getDigits(ps)}`;
    }

    return new AST.NumberLiteral(num);
  }

  getValue(ps) {
    if (ps.currentIs("{")) {
      ps.peek();
      ps.peekBlank();
      if (ps.currentPeek() === "*" || ps.currentPeek() === "[") {
        ps.resetPeek();
        return this.getVariantList(ps);
      }

      ps.resetPeek();
    }

    return this.getPattern(ps);
  }

  getVariantList(ps) {
    ps.expectChar("{");
    ps.skipBlank();
    const variants = this.getVariants(ps);
    ps.skipBlank();
    ps.expectChar("}");
    return new AST.VariantList(variants);
  }

  getPattern(ps) {
    const elements = [];
    ps.skipBlankInline();

    let ch;
    while ((ch = ps.current())) {

      // The end condition for getPattern's while loop is a newline
      // which is not followed by a valid pattern continuation.
      if (ch === "\n" && !ps.isPeekNextLineValue(false)) {
        break;
      }

      if (ch === "{") {
        const element = this.getPlaceable(ps);
        elements.push(element);
      } else {
        const element = this.getTextElement(ps);
        elements.push(element);
      }
    }

    // Trim trailing whitespace.
    const lastElement = elements[elements.length - 1];
    if (lastElement && lastElement.type === "TextElement") {
      lastElement.value = lastElement.value.replace(trailingWSRe, "");
    }

    return new AST.Pattern(elements);
  }

  getTextElement(ps) {
    let buffer = "";

    let ch;
    while ((ch = ps.current())) {
      if (ch === "{") {
        return new AST.TextElement(buffer);
      }

      if (ch === "\n") {
        if (!ps.isPeekNextLineValue(false)) {
          return new AST.TextElement(buffer);
        }

        ps.next();
        ps.skipBlankInline();

        // Add the new line to the buffer
        buffer += ch;
        continue;
      }

      if (ch === "\\") {
        ps.next();
        buffer += this.getEscapeSequence(ps);
      } else {
        buffer += ch;
        ps.next();
      }
    }

    return new AST.TextElement(buffer);
  }

  getEscapeSequence(ps, specials = ["{", "\\"]) {
    const next = ps.current();

    if (specials.includes(next)) {
      ps.next();
      return `\\${next}`;
    }

    if (next === "u") {
      let sequence = "";
      ps.next();

      for (let i = 0; i < 4; i++) {
        const ch = ps.takeHexDigit();

        if (ch === undefined) {
          throw new ParseError("E0026", sequence + ps.current());
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

    if (ps.currentIs("-")) {
      ps.peek();

      if (!ps.currentPeekIs(">")) {
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
      ps.expectChar("\n");
      ps.skipBlank();

      const variants = this.getVariants(ps);
      ps.skipBlank();

      if (variants.length === 0) {
        throw new ParseError("E0011");
      }

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
    if (ps.currentIs("{")) {
      return this.getPlaceable(ps);
    }
    const literal = this.getLiteral(ps);

    if (literal.type !== "MessageReference"
      && literal.type !== "TermReference") {
      return literal;
    }

    const ch = ps.current();

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

    if (ps.current() !== ":") {
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
      if (ps.current() === ")") {
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

      if (ps.current() === ",") {
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
    } else if (ps.currentIs('"')) {
      return this.getString(ps);
    }
    throw new ParseError("E0012");
  }

  getString(ps) {
    let val = "";

    ps.expectChar('"');

    let ch;
    while ((ch = ps.takeChar(x => x !== '"' && x !== "\n"))) {
      if (ch === "\\") {
        val += this.getEscapeSequence(ps, ["{", "\\", "\""]);
      } else {
        val += ch;
      }
    }

    if (ps.currentIs("\n")) {
      throw new ParseError("E0020");
    }

    ps.next();

    return new AST.StringLiteral(val);

  }

  getLiteral(ps) {
    const ch = ps.current();

    if (!ch) {
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
      const id = this.getTermIdentifier(ps);
      return new AST.TermReference(id);
    }

    if (ch === '"') {
      return this.getString(ps);
    }

    throw new ParseError("E0014");
  }
}
