/*  eslint no-magic-numbers: [0]  */

import * as AST from "./ast";
import { FTLParserStream } from "./ftlstream";
import { ParseError } from "./errors";


function withSpan(fn) {
  return function(ps, ...args) {
    if (!this.withSpans) {
      return fn.call(this, ps, ...args);
    }

    let start = ps.getIndex();
    const node = fn.call(this, ps, ...args);

    // Don't re-add the span if the node already has it.  This may happen when
    // one decorated function calls another decorated function.
    if (node.span) {
      return node;
    }

    // Spans of Messages and Sections should include the attached Comment.
    if (node.type === "Message") {
      if (node.comment !== null) {
        start = node.comment.span.start;
      }
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
    [
      "getComment", "getMessage", "getAttribute", "getIdentifier",
      "getVariant", "getVariantName", "getNumber", "getPattern",
      "getTextElement", "getPlaceable", "getExpression",
      "getSelectorExpression", "getCallArg", "getString", "getLiteral",
      "getGroupCommentFromSection"
    ].forEach(
      name => this[name] = withSpan(this[name])
    );
  }

  parse(source) {
    const ps = new FTLParserStream(source);
    ps.skipBlankLines();

    const entries = [];

    while (ps.current()) {
      const entry = this.getEntryOrJunk(ps);

      if (entry === null) {
        // That happens when we get a 0.4 style section
        continue;
      }

      if (entry.type === "Comment" &&
        ps.lastCommentZeroFourSyntax && entries.length === 0) {
        const comment = new AST.ResourceComment(entry.content);
        comment.span = entry.span;
        entries.push(comment);
      } else {
        entries.push(entry);
      }

      ps.lastCommentZeroFourSyntax = false;
      ps.skipBlankLines();
    }

    const res = new AST.Resource(entries);

    if (this.withSpans) {
      res.addSpan(0, ps.getIndex());
    }

    return res;
  }

  parseEntry(source) {
    const ps = new FTLParserStream(source);
    ps.skipBlankLines();
    return this.getEntryOrJunk(ps);
  }

  getEntryOrJunk(ps) {
    const entryStartPos = ps.getIndex();

    try {
      return this.getEntry(ps);
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
    let comment;

    if (ps.currentIs("/") || ps.currentIs("#")) {
      comment = this.getComment(ps);

      // The Comment content doesn't include the trailing newline. Consume
      // this newline here to be ready for the next entry.  undefined stands
      // for EOF.
      ps.expectChar(ps.current() ? "\n" : undefined);
    }

    if (ps.currentIs("[")) {
      const groupComment = this.getGroupCommentFromSection(ps, comment);
      if (comment && this.withSpans) {
        // The Group Comment should start where the section comment starts.
        groupComment.span.start = comment.span.start;
      }
      return groupComment;
    }

    if (ps.isEntryIDStart() && (!comment || comment.type === "Comment")) {
      return this.getMessage(ps, comment);
    }

    if (comment) {
      return comment;
    }

    throw new ParseError("E0002");
  }

  getZeroFourStyleComment(ps) {
    ps.expectChar("/");
    ps.expectChar("/");
    ps.takeCharIf(" ");

    let content = "";

    while (true) {
      let ch;
      while ((ch = ps.takeChar(x => x !== "\n"))) {
        content += ch;
      }

      if (ps.isPeekNextLineZeroFourStyleComment()) {
        content += "\n";
        ps.next();
        ps.expectChar("/");
        ps.expectChar("/");
        ps.takeCharIf(" ");
      } else {
        break;
      }
    }

    const comment = new AST.Comment(content);
    ps.lastCommentZeroFourSyntax = true;
    return comment;
  }

  getComment(ps) {
    if (ps.currentIs("/")) {
      return this.getZeroFourStyleComment(ps);
    }

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

      if (ps.isPeekNextLineComment(level, false)) {
        content += "\n";
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

  getGroupCommentFromSection(ps, comment) {
    ps.expectChar("[");
    ps.expectChar("[");

    ps.skipInlineWS();

    this.getVariantName(ps);

    ps.skipInlineWS();

    ps.expectChar("]");
    ps.expectChar("]");

    if (comment) {
      return new AST.GroupComment(comment.content);
    }

    // A Section without a comment is like an empty Group Comment. Semantically
    // it ends the previous group and starts a new one.
    return new AST.GroupComment("");
  }

  getMessage(ps, comment) {
    const id = this.getEntryIdentifier(ps);

    ps.skipInlineWS();

    let pattern;
    let attrs;

    // XXX Syntax 0.4 compatibility.
    // XXX Replace with ps.expectChar('=').
    if (ps.currentIs("=")) {
      ps.next();

      if (ps.isPeekPatternStart()) {
        ps.skipIndent();
        pattern = this.getPattern(ps);
      } else {
        ps.skipInlineWS();
      }
    }

    if (id.name.startsWith("-") && pattern === undefined) {
      throw new ParseError("E0006", id.name);
    }

    if (ps.isPeekNextLineAttributeStart()) {
      attrs = this.getAttributes(ps);
    }

    if (id.name.startsWith("-")) {
      return new AST.Term(id, pattern, attrs, comment);
    }

    if (pattern === undefined && attrs === undefined) {
      throw new ParseError("E0005", id.name);
    }

    return new AST.Message(id, pattern, attrs, comment);
  }

  getAttribute(ps) {
    ps.expectChar(".");

    const key = this.getIdentifier(ps);

    ps.skipInlineWS();
    ps.expectChar("=");

    if (ps.isPeekPatternStart()) {
      ps.skipIndent();
      const value = this.getPattern(ps);
      return new AST.Attribute(key, value);
    }

    throw new ParseError("E0012");
  }

  getAttributes(ps) {
    const attrs = [];

    while (true) {
      ps.expectIndent();
      const attr = this.getAttribute(ps);
      attrs.push(attr);

      if (!ps.isPeekNextLineAttributeStart()) {
        break;
      }
    }
    return attrs;
  }

  getEntryIdentifier(ps) {
    return this.getIdentifier(ps, true);
  }

  getIdentifier(ps, allowTerm = false) {
    let name = "";
    name += ps.takeIDStart(allowTerm);

    let ch;
    while ((ch = ps.takeIDChar())) {
      name += ch;
    }

    return new AST.Identifier(name);
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

    return this.getVariantName(ps);
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

    const key = this.getVariantKey(ps);

    ps.expectChar("]");

    if (ps.isPeekPatternStart()) {
      ps.skipIndent();
      const value = this.getPattern(ps);
      return new AST.Variant(key, value, defaultIndex);
    }

    throw new ParseError("E0012");
  }

  getVariants(ps) {
    const variants = [];
    let hasDefault = false;

    while (true) {
      ps.expectIndent();
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

  getVariantName(ps) {
    let name = "";

    name += ps.takeIDStart(false);

    while (true) {
      const ch = ps.takeVariantNameChar();
      if (ch) {
        name += ch;
      } else {
        break;
      }
    }

    return new AST.VariantName(name.trimRight());
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

  getPattern(ps) {
    const elements = [];
    ps.skipInlineWS();

    let ch;
    while ((ch = ps.current())) {

      // The end condition for getPattern's while loop is a newline
      // which is not followed by a valid pattern continuation.
      if (ch === "\n" && !ps.isPeekNextLinePatternStart()) {
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
        if (!ps.isPeekNextLinePatternStart()) {
          return new AST.TextElement(buffer);
        }

        ps.next();
        ps.skipInlineWS();

        // Add the new line to the buffer
        buffer += ch;
        continue;
      }

      if (ch === "\\") {
        const ch2 = ps.next();

        if (ch2 === "{" || ch2 === '"') {
          buffer += ch2;
        } else {
          buffer += ch + ch2;
        }

      } else {
        buffer += ps.ch;
      }

      ps.next();
    }

    return new AST.TextElement(buffer);
  }

  getPlaceable(ps) {
    ps.expectChar("{");
    const expression = this.getExpression(ps);
    ps.expectChar("}");
    return new AST.Placeable(expression);
  }

  getExpression(ps) {
    if (ps.isPeekNextLineVariantStart()) {
      const variants = this.getVariants(ps);

      ps.expectIndent();

      return new AST.SelectExpression(null, variants);
    }

    ps.skipInlineWS();

    const selector = this.getSelectorExpression(ps);

    ps.skipInlineWS();

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
          !selector.id.name.startsWith("-")) {
        throw new ParseError("E0018");
      }

      if (selector.type === "VariantExpression") {
        throw new ParseError("E0017");
      }

      ps.next();
      ps.next();

      ps.skipInlineWS();

      const variants = this.getVariants(ps);

      if (variants.length === 0) {
        throw new ParseError("E0011");
      }

      ps.expectIndent();

      return new AST.SelectExpression(selector, variants);
    } else if (selector.type === "AttributeExpression" &&
               selector.id.name.startsWith("-")) {
      throw new ParseError("E0019");
    }

    return selector;
  }

  getSelectorExpression(ps) {
    const literal = this.getLiteral(ps);

    if (literal.type !== "MessageReference") {
      return literal;
    }

    const ch = ps.current();

    if (ch === ".") {
      ps.next();

      const attr = this.getIdentifier(ps);
      return new AST.AttributeExpression(literal.id, attr);
    }

    if (ch === "[") {
      ps.next();

      const key = this.getVariantKey(ps);

      ps.expectChar("]");

      return new AST.VariantExpression(literal, key);
    }

    if (ch === "(") {
      ps.next();

      const args = this.getCallArgs(ps);

      ps.expectChar(")");

      if (!/^[A-Z][A-Z_?-]*$/.test(literal.id.name)) {
        throw new ParseError("E0008");
      }

      const func = new AST.Function(literal.id.name);
      if (this.withSpans) {
        func.addSpan(literal.span.start, literal.span.end);
      }

      return new AST.CallExpression(
        func,
        args
      );
    }

    return literal;
  }

  getCallArg(ps) {
    const exp = this.getSelectorExpression(ps);

    ps.skipInlineWS();

    if (ps.current() !== ":") {
      return exp;
    }

    if (exp.type !== "MessageReference") {
      throw new ParseError("E0009");
    }

    ps.next();
    ps.skipInlineWS();

    const val = this.getArgVal(ps);

    return new AST.NamedArgument(exp.id, val);
  }

  getCallArgs(ps) {
    const args = [];
    const argumentNames = new Set();

    ps.skipInlineWS();

    while (true) {
      if (ps.current() === ")") {
        break;
      }

      const arg = this.getCallArg(ps);
      if (arg.type === "NamedArgument") {
        if (argumentNames.has(arg.name.name)) {
          throw new ParseError("E0022");
        }
        argumentNames.add(arg.name.name);
      } else if (argumentNames.size > 0) {
        throw new ParseError("E0021");
      }
      args.push(arg);

      ps.skipInlineWS();

      if (ps.current() === ",") {
        ps.next();
        ps.skipInlineWS();
        continue;
      } else {
        break;
      }
    }
    return args;
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
      val += ch;
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
      const name = this.getIdentifier(ps);
      return new AST.VariableReference(name);
    }

    if (ps.isEntryIDStart()) {
      const name = this.getEntryIdentifier(ps);
      return new AST.MessageReference(name);
    }

    if (ps.isNumberStart()) {
      return this.getNumber(ps);
    }

    if (ch === '"') {
      return this.getString(ps);
    }

    throw new ParseError("E0014");
  }
}
