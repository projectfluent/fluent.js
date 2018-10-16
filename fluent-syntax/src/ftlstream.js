/* eslint no-magic-numbers: "off" */

import { ParserStream } from "./stream";
import { ParseError } from "./errors";
import { includes } from "./util";

const INLINE_WS = " ";
const ANY_WS = [INLINE_WS, "\n"];
const SPECIAL_LINE_START_CHARS = ["}", ".", "[", "*"];

export class FTLParserStream extends ParserStream {
  skipBlankInline() {
    while (this.currentChar) {
      if (this.currentChar !== INLINE_WS) {
        break;
      }
      this.next();
    }
  }

  peekBlankInline() {
    let ch = this.currentPeek;
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

      if (this.currentPeek === "\n") {
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
      const lineStart = this.peekOffset;

      this.peekBlankInline();

      if (this.currentPeek === "\n") {
        this.peek();
      } else {
        this.resetPeek(lineStart);
        break;
      }
    }
  }

  skipBlank() {
    while (includes(ANY_WS, this.currentChar)) {
      this.next();
    }
  }

  peekBlank() {
    while (includes(ANY_WS, this.currentPeek)) {
      this.peek();
    }
  }

  expectChar(ch) {
    if (this.currentChar === ch) {
      this.next();
      return true;
    }

    if (ch === "\n") {
      // Unicode Character 'SYMBOL FOR NEWLINE' (U+2424)
      throw new ParseError("E0003", "\u2424");
    }

    throw new ParseError("E0003", ch);
  }

  expectLineEnd() {
    if (this.currentChar === undefined) {
      // EOF is a valid line end in Fluent.
      return true;
    }

    return this.expectChar("\n");
  }

  takeChar(f) {
    const ch = this.currentChar;
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
    return this.isCharIDStart(this.currentPeek);
  }

  isNumberStart() {
    const ch = this.currentChar === "-"
      ? this.peek()
      : this.currentChar;

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

  isValueStart({skip = true}) {
    if (skip === false) throw new Error("Unimplemented");

    this.peekBlankInline();
    const ch = this.currentPeek;

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

    if (this.currentPeek !== "\n") {
      return false;
    }

    let i = 0;

    while (i <= level || (level === -1 && i < 3)) {
      if (this.peek() !== "#") {
        if (i <= level && level !== -1) {
          this.resetPeek();
          return false;
        }
        break;
      }
      i++;
    }

    if ([" ", "\n"].includes(this.peek())) {
      this.resetPeek();
      return true;
    }

    this.resetPeek();
    return false;
  }

  isNextLineVariantStart({skip = false}) {
    if (skip === true) throw new Error("Unimplemented");

    if (this.currentPeek !== "\n") {
      return false;
    }

    this.peekBlank();

    if (this.currentPeek === "*") {
      this.peek();
    }

    if (this.currentPeek === "[") {
      this.resetPeek();
      return true;
    }
    this.resetPeek();
    return false;
  }

  isNextLineAttributeStart({skip = true}) {
    if (skip === false) throw new Error("Unimplemented");

    this.peekBlank();

    if (this.currentPeek === ".") {
      this.skipToPeek();
      return true;
    }

    this.resetPeek();
    return false;
  }

  isNextLineValue({skip = true}) {
    if (this.currentPeek !== "\n") {
      return false;
    }

    this.peekBlankBlock();

    const ptr = this.peekOffset;

    this.peekBlankInline();

    if (this.currentPeek !== "{") {
      if (this.peekOffset - ptr === 0) {
        this.resetPeek();
        return false;
      }

      if (!this.isCharPatternContinuation(this.currentPeek)) {
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

  skipToNextEntryStart(junkStart) {
    let lastNewline = this.string.lastIndexOf("\n", this.index);
    if (junkStart < lastNewline) {
      // Last seen newline is _after_ the junk start. It's safe to rewind
      // without the risk of resuming at the same broken entry.
      this.index = lastNewline;
    }
    while (this.currentChar) {
      // We're only interested in beginnings of line.
      if (this.currentChar !== "\n") {
        this.next();
        continue;
      }

      // Break if the first char in this line looks like an entry start.
      const first = this.next();
      if (this.isCharIDStart(first) || first === "-" || first === "#") {
        break;
      }
    }
  }

  takeIDStart() {
    if (this.isCharIDStart(this.currentChar)) {
      const ret = this.currentChar;
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
