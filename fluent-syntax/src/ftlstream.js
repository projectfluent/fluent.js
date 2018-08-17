/* eslint no-magic-numbers: "off" */

import { ParserStream } from "./stream";
import { ParseError } from "./errors";
import { includes } from "./util";

const INLINE_WS = [" ", "\t"];
const ANY_WS = [" ", "\t", "\r", "\n"];
const LINE_END = ["\n", "\r\n"];
const SPECIAL_LINE_START_CHARS = ["}", ".", "[", "*"];

export class FTLParserStream extends ParserStream {
  skipBlankInlineWS() {
    while (this.ch) {
      if (!includes(INLINE_WS, this.ch)) {
        break;
      }
      this.next();
    }
  }

  skipBlank() {
    while (this.ch) {
      if (!includes(ANY_WS, this.ch)) {
        break;
      }
      this.next();
    }
  }

  peekBlankInlineWS() {
    let ch = this.currentPeek();
    while (ch) {
      if (!includes(INLINE_WS, ch)) {
        break;
      }
      ch = this.peek();
    }
  }

  peekBlank() {
    let ch = this.currentPeek();
    while (ch) {
      if (!includes(ANY_WS, ch)) {
        break;
      }
      ch = this.peek();
    }
  }

  peekLineEnd() {
    let ch = this.currentPeek();
    if (!includes(LINE_END, ch)) {
      ch = this.peek();
    } else {
      throw new ParseError("E0003", ch); // This is a placeholder error
    }
  }

  skipLineBreak() {
    let lineCount = 0;
    while (true) {
      this.peekBlankInlineWS();

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

  peekLineBreak() {
    while (true) {
      const lineStart = this.getPeekIndex();

      this.peekBlankInlineWS();

      if (this.currentPeekIs("\n")) {
        this.peek();
      } else {
        this.resetPeek(lineStart);
        break;
      }
    }
  }

  skipBlankBlock() {
    this.skipLineBreak();
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

  expectBlankBlock() {
    this.expectChar("\n");
    this.skipLineBreak();
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

  isPeekValueStart() {
    this.peekBlankInlineWS();
    const ch = this.currentPeek();

    // Inline Patterns may start with any char.
    if (ch !== undefined && ch !== "\n") {
      return true;
    }

    return this.isPeekNextLineValue();
  }

  // -1 - any
  //  0 - comment
  //  1 - group comment
  //  2 - resource comment
  isPeekNextLineComment(level = -1) {
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

  isPeekNextLineVariantStart() {
    if (!this.currentPeekIs("\n")) {
      return false;
    }

    this.peek();

    this.peekLineBreak();

    const ptr = this.getPeekIndex();

    this.peekBlankInlineWS();

    if (this.currentPeekIs("*")) {
      this.peek();
    }

    if (this.currentPeekIs("[") && !this.peekCharIs("[")) {
      this.resetPeek();
      return true;
    }
    this.resetPeek();
    return false;
  }

  isPeekNextLineAttributeStart() {
    if (!this.currentPeekIs("\n")) {
      return false;
    }

    this.peek();

    this.peekLineBreak();

    const ptr = this.getPeekIndex();

    this.peekLineEnd();
    this.peekBlank();

    if (this.getPeekIndex() - ptr === 0) {
      this.resetPeek();
      return false;
    }

    if (this.currentPeekIs(".")) {
      this.resetPeek();
      return true;
    }

    this.resetPeek();
    return false;
  }

  isPeekNextLineValue() {
    if (!this.currentPeekIs("\n")) {
      return false;
    }

    this.peek();

    this.peekLineBreak();

    const ptr = this.getPeekIndex();

    this.peekBlankInlineWS();

    let isIndented = this.getPeekIndex() - ptr !== 0;

    // Placeable / VariantList can start irrelevant of indentation
    if (this.currentPeekIs('{')) {
      this.resetPeek();
      return true;
    }

    // character pattern can start only indented
    if (this.isCharPatternContinuation(this.currentPeek())) {
      this.resetPeek();
      return isIndented;
    }

    this.resetPeek();
    return false;
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

  takeVariantNameChar() {
    const closure = ch => {
      const cc = ch.charCodeAt(0);
      return ((cc >= 97 && cc <= 122) || // a-z
              (cc >= 65 && cc <= 90) || // A-Z
              (cc >= 48 && cc <= 57) || // 0-9
               cc === 95 || cc === 45 || cc === 32); // _-<space>
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
