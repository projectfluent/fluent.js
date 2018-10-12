/* eslint no-magic-numbers: "off" */

import { ParserStream } from "./stream";
import { ParseError } from "./errors";
import { includes } from "./util";

const INLINE_WS = " ";
const ANY_WS = [INLINE_WS, "\n"];
const SPECIAL_LINE_START_CHARS = ["}", ".", "[", "*"];

export class FTLParserStream extends ParserStream {
  skipBlankInline() {
    while (this.ch) {
      if (this.ch !== INLINE_WS) {
        break;
      }
      this.next();
    }
  }

  peekBlankInline() {
    let ch = this.currentPeek();
    while (ch) {
      if (ch !== INLINE_WS) {
        break;
      }
      ch = this.peek();
    }
  }

  skipBlankBlock() {
    let lineCount = 0;
    while (true) {
      this.peekBlankInline();

      if (this.currentPeekIs("\n")) {
        this.skipToPeek();
        this.next();
        lineCount++;
      } else {
        this.resetPeek();
        return lineCount;
      }
    }
  }

  peekBlankBlock() {
    while (true) {
      const lineStart = this.getPeekIndex();

      this.peekBlankInline();

      if (this.currentPeekIs("\n")) {
        this.peek();
      } else {
        this.resetPeek(lineStart);
        break;
      }
    }
  }

  skipBlank() {
    while (includes(ANY_WS, this.ch)) {
      this.next();
    }
  }

  peekBlank() {
    while (includes(ANY_WS, this.currentPeek())) {
      this.peek();
    }
  }

  expectChar(ch) {
    if (this.ch === ch) {
      this.next();
      return true;
    }

    if (ch === "\n") {
      // Unicode Character 'SYMBOL FOR NEWLINE' (U+2424)
      throw new ParseError("E0003", "\u2424");
    }

    throw new ParseError("E0003", ch);
  }

  expectIndent() {
    this.expectChar("\n");
    this.skipBlankBlock();
    this.expectChar(" ");
    this.skipBlankInline();
  }

  expectLineEnd() {
    if (this.ch === undefined) {
      // EOF is a valid line end in Fluent.
      return true;
    }

    return this.expectChar("\n");
  }

  takeChar(f) {
    const ch = this.ch;
    if (ch !== undefined && f(ch)) {
      this.next();
      return ch;
    }
    return undefined;
  }

  isCharIDStart(ch) {
    if (ch === undefined) {
      return false;
    }

    const cc = ch.charCodeAt(0);
    return (cc >= 97 && cc <= 122) || // a-z
           (cc >= 65 && cc <= 90); // A-Z
  }

  isIdentifierStart() {
    const ch = this.currentPeek();
    const isID = this.isCharIDStart(ch);
    this.resetPeek();
    return isID;
  }

  isNumberStart() {
    const ch = this.currentIs("-")
      ? this.peek()
      : this.current();

    if (ch === undefined) {
      this.resetPeek();
      return false;
    }

    const cc = ch.charCodeAt(0);
    const isDigit = cc >= 48 && cc <= 57; // 0-9
    this.resetPeek();
    return isDigit;
  }

  isCharPatternContinuation(ch) {
    if (ch === undefined) {
      return false;
    }

    return !includes(SPECIAL_LINE_START_CHARS, ch);
  }

  isValueStart({skip = true} = {}) {
    if (skip === false) throw new Error("Unimplemented");

    this.peekBlankInline();
    const ch = this.currentPeek();

    // Inline Patterns may start with any char.
    if (ch !== undefined && ch !== "\n") {
      this.skipToPeek();
      return true;
    }

    return this.isNextLineValue({skip});
  }

  // -1 - any
  //  0 - comment
  //  1 - group comment
  //  2 - resource comment
  isNextLineComment(level = -1, {skip = false}) {
    if (skip === true) throw new Error("Unimplemented");

    if (!this.currentPeekIs("\n")) {
      return false;
    }

    let i = 0;

    while (i <= level || (level === -1 && i < 3)) {
      this.peek();
      if (!this.currentPeekIs("#")) {
        if (i <= level && level !== -1) {
          this.resetPeek();
          return false;
        }
        break;
      }
      i++;
    }

    this.peek();
    if ([" ", "\n"].includes(this.currentPeek())) {
      this.resetPeek();
      return true;
    }

    this.resetPeek();
    return false;
  }

  isNextLineVariantStart({skip = false}) {
    if (skip === true) throw new Error("Unimplemented");

    if (!this.currentPeekIs("\n")) {
      return false;
    }

    this.peekBlank();

    if (this.currentPeekIs("*")) {
      this.peek();
    }

    if (this.currentPeekIs("[")) {
      this.resetPeek();
      return true;
    }
    this.resetPeek();
    return false;
  }

  isNextLineAttributeStart({skip = true}) {
    if (skip === false) throw new Error("Unimplemented");

    this.peekBlank();

    if (this.currentPeekIs(".")) {
      this.skipToPeek();
      return true;
    }

    this.resetPeek();
    return false;
  }

  isNextLineValue({skip = true}) {
    if (!this.currentPeekIs("\n")) {
      return false;
    }

    this.peekBlankBlock();

    const ptr = this.getPeekIndex();

    this.peekBlankInline();

    if (!this.currentPeekIs("{")) {
      if (this.getPeekIndex() - ptr === 0) {
        this.resetPeek();
        return false;
      }

      if (!this.isCharPatternContinuation(this.currentPeek())) {
        this.resetPeek();
        return false;
      }
    }

    if (skip) {
      this.skipToPeek();
    } else {
      this.resetPeek();
    }
    return true;
  }

  skipToNextEntryStart() {
    while (this.ch) {
      if (this.currentIs("\n") && !this.peekCharIs("\n")) {
        this.next();
        if (this.ch === undefined ||
            this.isIdentifierStart() ||
            this.currentIs("-") ||
            this.currentIs("#")) {
          break;
        }
      }
      this.next();
    }
  }

  takeIDStart() {
    if (this.isCharIDStart(this.ch)) {
      const ret = this.ch;
      this.next();
      return ret;
    }

    throw new ParseError("E0004", "a-zA-Z");
  }

  takeIDChar() {
    const closure = ch => {
      const cc = ch.charCodeAt(0);
      return ((cc >= 97 && cc <= 122) || // a-z
              (cc >= 65 && cc <= 90) || // A-Z
              (cc >= 48 && cc <= 57) || // 0-9
               cc === 95 || cc === 45); // _-
    };

    return this.takeChar(closure);
  }

  takeDigit() {
    const closure = ch => {
      const cc = ch.charCodeAt(0);
      return (cc >= 48 && cc <= 57); // 0-9
    };

    return this.takeChar(closure);
  }

  takeHexDigit() {
    const closure = ch => {
      const cc = ch.charCodeAt(0);
      return (cc >= 48 && cc <= 57) // 0-9
        || (cc >= 65 && cc <= 70) // A-F
        || (cc >= 97 && cc <= 102); // a-f
    };

    return this.takeChar(closure);
  }
}
