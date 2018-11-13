/* eslint no-magic-numbers: "off" */

import { ParseError } from "./errors";
import { includes } from "./util";

export class ParserStream {
  constructor(string) {
    this.string = string;
    this.index = 0;
    this.peekOffset = 0;
  }

  charAt(offset) {
    // When the cursor is at CRLF, return LF but don't move the cursor.
    // The cursor still points to the EOL position, which in this case is the
    // beginning of the compound CRLF sequence. This ensures slices of
    // [inclusive, exclusive) continue to work properly.
    if (this.string[offset] === "\r"
        && this.string[offset + 1] === "\n") {
      return "\n";
    }

    return this.string[offset];
  }

  get currentChar() {
    return this.charAt(this.index);
  }

  get currentPeek() {
    return this.charAt(this.index + this.peekOffset);
  }

  next() {
    this.peekOffset = 0;
    // Skip over the CRLF as if it was a single character.
    if (this.string[this.index] === "\r"
        && this.string[this.index + 1] === "\n") {
      this.index++;
    }
    this.index++;
    return this.string[this.index];
  }

  peek() {
    // Skip over the CRLF as if it was a single character.
    if (this.string[this.index + this.peekOffset] === "\r"
        && this.string[this.index + this.peekOffset + 1] === "\n") {
      this.peekOffset++;
    }
    this.peekOffset++;
    return this.string[this.index + this.peekOffset];
  }

  resetPeek(offset = 0) {
    this.peekOffset = offset;
  }

  skipToPeek() {
    this.index += this.peekOffset;
    this.peekOffset = 0;
  }
}

export const EOL = "\n";
export const EOF = undefined;
const SPECIAL_LINE_START_CHARS = ["}", ".", "[", "*"];

export class FluentParserStream extends ParserStream {
  skipBlankInline() {
    while (this.currentChar === " ") {
      this.next();
    }
  }

  peekBlankInline() {
    while (this.currentPeek === " ") {
      this.peek();
    }
  }

  skipBlankBlock() {
    let lineCount = 0;
    while (true) {
      this.peekBlankInline();

      if (this.currentPeek === EOL) {
        this.next();
        lineCount++;
      } else if (this.currentPeek === EOF) {
        // Consume inline blanks before the EOF.
        this.skipToPeek();
        return lineCount;
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

      if (this.currentPeek === EOL) {
        this.peek();
      } else {
        this.resetPeek(lineStart);
        break;
      }
    }
  }

  skipBlank() {
    while (this.currentChar === " " || this.currentChar === EOL) {
      this.next();
    }
  }

  peekBlank() {
    while (this.currentPeek === " " || this.currentPeek === EOL) {
      this.peek();
    }
  }

  expectChar(ch) {
    if (this.currentChar === ch) {
      this.next();
      return true;
    }

    throw new ParseError("E0003", ch);
  }

  expectLineEnd() {
    if (this.currentChar === EOF) {
      // EOF is a valid line end in Fluent.
      return true;
    }

    if (this.currentChar === EOL) {
      this.next();
      return true;
    }

    // Unicode Character 'SYMBOL FOR NEWLINE' (U+2424)
    throw new ParseError("E0003", "\u2424");
  }

  takeChar(f) {
    const ch = this.currentChar;
    if (ch === EOF) {
      return EOF;
    }
    if (f(ch)) {
      this.next();
      return ch;
    }
    return null;
  }

  isCharIdStart(ch) {
    if (ch === EOF) {
      return false;
    }

    const cc = ch.charCodeAt(0);
    return (cc >= 97 && cc <= 122) || // a-z
           (cc >= 65 && cc <= 90); // A-Z
  }

  isIdentifierStart() {
    return this.isCharIdStart(this.currentPeek);
  }

  isNumberStart() {
    const ch = this.currentChar === "-"
      ? this.peek()
      : this.currentChar;

    if (ch === EOF) {
      this.resetPeek();
      return false;
    }

    const cc = ch.charCodeAt(0);
    const isDigit = cc >= 48 && cc <= 57; // 0-9
    this.resetPeek();
    return isDigit;
  }

  isCharPatternContinuation(ch) {
    if (ch === EOF) {
      return false;
    }

    return !includes(SPECIAL_LINE_START_CHARS, ch);
  }

  isValueStart({skip = true}) {
    if (skip === false) throw new Error("Unimplemented");

    this.peekBlankInline();
    const ch = this.currentPeek;

    // Inline Patterns may start with any char.
    if (ch !== EOF && ch !== EOL) {
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

    if (this.currentPeek !== EOL) {
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

    // The first char after #, ## or ###.
    const ch = this.peek();
    if (ch === " " || ch === EOL) {
      this.resetPeek();
      return true;
    }

    this.resetPeek();
    return false;
  }

  isNextLineVariantStart({skip = false}) {
    if (skip === true) throw new Error("Unimplemented");

    if (this.currentPeek !== EOL) {
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
    if (this.currentPeek !== EOL) {
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

  skipToJunkEnd(junkStart) {
    let lastNewline = this.string.lastIndexOf(EOL, this.index);
    if (junkStart < lastNewline) {
      // Last seen newline is _after_ the junk start. It's safe to rewind
      // without the risk of resuming at the same broken entry.
      this.index = lastNewline;
    }
    while (this.currentChar) {
      // We're only interested in beginnings of line.
      if (this.currentChar !== EOL) {
        this.next();
        continue;
      }

      const ch = this.next();
      // Break if the first char in this line looks like a beginning of a
      // message, term or comment, or if it's a blank line.
      if (this.isCharIdStart(ch) || ch === "-" || ch === "#" || ch === EOL) {
        break;
      }
    }
  }

  takeIDStart() {
    if (this.isCharIdStart(this.currentChar)) {
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
