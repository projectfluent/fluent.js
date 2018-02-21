/* eslint no-magic-numbers: "off" */

import { ParserStream } from "./stream";
import { ParseError } from "./errors";
import { includes } from "./util";

const INLINE_WS = [" ", "\t"];
const SPECIAL_LINE_START_CHARS = ["}", ".", "[", "*"];

export class FTLParserStream extends ParserStream {
  skipInlineWS() {
    while (this.ch) {
      if (!includes(INLINE_WS, this.ch)) {
        break;
      }
      this.next();
    }
  }

  peekInlineWS() {
    let ch = this.currentPeek();
    while (ch) {
      if (!includes(INLINE_WS, ch)) {
        break;
      }
      ch = this.peek();
    }
  }

  skipBlankLines() {
    while (true) {
      this.peekInlineWS();

      if (this.currentPeekIs("\n")) {
        this.skipToPeek();
        this.next();
      } else {
        this.resetPeek();
        break;
      }
    }
  }

  peekBlankLines() {
    while (true) {
      const lineStart = this.getPeekIndex();

      this.peekInlineWS();

      if (this.currentPeekIs("\n")) {
        this.peek();
      } else {
        this.resetPeek(lineStart);
        break;
      }
    }
  }

  skipIndent() {
    this.skipBlankLines();
    this.skipInlineWS();
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
    this.skipBlankLines();
    this.expectChar(" ");
    this.skipInlineWS();
  }

  takeCharIf(ch) {
    if (this.ch === ch) {
      this.next();
      return true;
    }
    return false;
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

  isEntryIDStart() {
    if (this.currentIs("-")) {
      this.peek();
    }

    const ch = this.currentPeek();
    const isID = this.isCharIDStart(ch);
    this.resetPeek();
    return isID;
  }

  isNumberStart() {
    if (this.currentIs("-")) {
      this.peek();
    }

    const cc = this.currentPeek().charCodeAt(0);
    const isDigit = cc >= 48 && cc <= 57; // 0-9
    this.resetPeek();
    return isDigit;
  }

  isCharPatternContinuation(ch) {
    return !includes(SPECIAL_LINE_START_CHARS, ch);
  }

  isPeekPatternStart() {
    this.peekInlineWS();
    const ch = this.currentPeek();

    // Inline Patterns may start with any char.
    if (ch !== undefined && ch !== "\n") {
      return true;
    }

    return this.isPeekNextLinePatternStart();
  }

  isPeekNextLineZeroFourStyleComment() {
    if (!this.currentPeekIs("\n")) {
      return false;
    }

    this.peek();

    if (this.currentPeekIs("/")) {
      this.peek();
      if (this.currentPeekIs("/")) {
        this.resetPeek();
        return true;
      }
    }

    this.resetPeek();
    return false;
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
        if (i !== level && level !== -1) {
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

    this.peekBlankLines();

    const ptr = this.getPeekIndex();

    this.peekInlineWS();

    if (this.getPeekIndex() - ptr === 0) {
      this.resetPeek();
      return false;
    }

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

    this.peekBlankLines();

    const ptr = this.getPeekIndex();

    this.peekInlineWS();

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

  isPeekNextLinePatternStart() {
    if (!this.currentPeekIs("\n")) {
      return false;
    }

    this.peek();

    this.peekBlankLines();

    const ptr = this.getPeekIndex();

    this.peekInlineWS();

    if (this.getPeekIndex() - ptr === 0) {
      this.resetPeek();
      return false;
    }

    if (!this.isCharPatternContinuation(this.currentPeek())) {
      this.resetPeek();
      return false;
    }

    this.resetPeek();
    return true;
  }

  skipToNextEntryStart() {
    while (this.ch) {
      if (this.currentIs("\n") && !this.peekCharIs("\n")) {
        this.next();
        if (this.ch === undefined ||
            this.isEntryIDStart() ||
            this.currentIs("#") ||
            (this.currentIs("/") && this.peekCharIs("/")) ||
            (this.currentIs("[") && this.peekCharIs("["))) {
          break;
        }
      }
      this.next();
    }
  }

  takeIDStart(allowTerm) {
    if (allowTerm && this.currentIs("-")) {
      this.next();
      return "-";
    }

    if (this.isCharIDStart(this.ch)) {
      const ret = this.ch;
      this.next();
      return ret;
    }

    const allowedRange = allowTerm ? "a-zA-Z-" : "a-zA-Z";
    throw new ParseError("E0004", allowedRange);
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
}
