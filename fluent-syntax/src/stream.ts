/* eslint no-magic-numbers: "off" */

import { ParseError } from "./errors.js";

export class ParserStream {
  public string: string;
  public index: number;
  public peekOffset: number;

  constructor(string: string) {
    this.string = string;
    this.index = 0;
    this.peekOffset = 0;
  }

  charAt(offset: number): string {
    // When the cursor is at CRLF, return LF but don't move the cursor.
    // The cursor still points to the EOL position, which in this case is the
    // beginning of the compound CRLF sequence. This ensures slices of
    // [inclusive, exclusive) continue to work properly.
    if (this.string[offset] === "\r" && this.string[offset + 1] === "\n") {
      return "\n";
    }

    return this.string[offset];
  }

  currentChar(): string {
    return this.charAt(this.index);
  }

  currentPeek(): string {
    return this.charAt(this.index + this.peekOffset);
  }

  next(): string {
    this.peekOffset = 0;
    // Skip over the CRLF as if it was a single character.
    if (
      this.string[this.index] === "\r" &&
      this.string[this.index + 1] === "\n"
    ) {
      this.index++;
    }
    this.index++;
    return this.string[this.index];
  }

  peek(): string {
    // Skip over the CRLF as if it was a single character.
    if (
      this.string[this.index + this.peekOffset] === "\r" &&
      this.string[this.index + this.peekOffset + 1] === "\n"
    ) {
      this.peekOffset++;
    }
    this.peekOffset++;
    return this.string[this.index + this.peekOffset];
  }

  resetPeek(offset: number = 0): void {
    this.peekOffset = offset;
  }

  skipToPeek(): void {
    this.index += this.peekOffset;
    this.peekOffset = 0;
  }
}

export const EOL = "\n";
export const EOF = undefined;
const SPECIAL_LINE_START_CHARS = ["}", ".", "[", "*"];

export class FluentParserStream extends ParserStream {
  peekBlankInline(): string {
    const start = this.index + this.peekOffset;
    while (this.currentPeek() === " ") {
      this.peek();
    }
    return this.string.slice(start, this.index + this.peekOffset);
  }

  skipBlankInline(): string {
    const blank = this.peekBlankInline();
    this.skipToPeek();
    return blank;
  }

  peekBlankBlock(): string {
    let blank = "";
    while (true) {
      const lineStart = this.peekOffset;
      this.peekBlankInline();
      if (this.currentPeek() === EOL) {
        blank += EOL;
        this.peek();
        continue;
      }
      if (this.currentPeek() === EOF) {
        // Treat the blank line at EOF as a blank block.
        return blank;
      }
      // Any other char; reset to column 1 on this line.
      this.resetPeek(lineStart);
      return blank;
    }
  }

  skipBlankBlock(): string {
    const blank = this.peekBlankBlock();
    this.skipToPeek();
    return blank;
  }

  peekBlank(): void {
    while (this.currentPeek() === " " || this.currentPeek() === EOL) {
      this.peek();
    }
  }

  skipBlank(): void {
    this.peekBlank();
    this.skipToPeek();
  }

  expectChar(ch: string): void {
    if (this.currentChar() === ch) {
      this.next();
      return;
    }

    throw new ParseError("E0003", ch);
  }

  expectLineEnd(): void {
    if (this.currentChar() === EOF) {
      // EOF is a valid line end in Fluent.
      return;
    }

    if (this.currentChar() === EOL) {
      this.next();
      return;
    }

    // Unicode Character 'SYMBOL FOR NEWLINE' (U+2424)
    throw new ParseError("E0003", "\u2424");
  }

  takeChar(f: (ch: string) => boolean): string | null | typeof EOF {
    const ch = this.currentChar();
    if (ch === EOF) {
      return EOF;
    }
    if (f(ch)) {
      this.next();
      return ch;
    }
    return null;
  }

  isCharIdStart(ch: string): boolean {
    if (ch === EOF) {
      return false;
    }

    const cc = ch.charCodeAt(0);
    return (
      (cc >= 97 && cc <= 122) || // a-z
      (cc >= 65 && cc <= 90)
    ); // A-Z
  }

  isIdentifierStart(): boolean {
    return this.isCharIdStart(this.currentPeek());
  }

  isNumberStart(): boolean {
    const ch = this.currentChar() === "-" ? this.peek() : this.currentChar();

    if (ch === EOF) {
      this.resetPeek();
      return false;
    }

    const cc = ch.charCodeAt(0);
    const isDigit = cc >= 48 && cc <= 57; // 0-9
    this.resetPeek();
    return isDigit;
  }

  isCharPatternContinuation(ch: string): boolean {
    if (ch === EOF) {
      return false;
    }

    return !SPECIAL_LINE_START_CHARS.includes(ch);
  }

  isValueStart(): boolean {
    // Inline Patterns may start with any char.
    const ch = this.currentPeek();
    return ch !== EOL && ch !== EOF;
  }

  isValueContinuation(): boolean {
    const column1 = this.peekOffset;
    this.peekBlankInline();

    if (this.currentPeek() === "{") {
      this.resetPeek(column1);
      return true;
    }

    if (this.peekOffset - column1 === 0) {
      return false;
    }

    if (this.isCharPatternContinuation(this.currentPeek())) {
      this.resetPeek(column1);
      return true;
    }

    return false;
  }

  // -1 - any
  //  0 - comment
  //  1 - group comment
  //  2 - resource comment
  isNextLineComment(level: number = -1): boolean {
    if (this.currentChar() !== EOL) {
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

  isVariantStart(): boolean {
    const currentPeekOffset = this.peekOffset;
    if (this.currentPeek() === "*") {
      this.peek();
    }
    if (this.currentPeek() === "[") {
      this.resetPeek(currentPeekOffset);
      return true;
    }
    this.resetPeek(currentPeekOffset);
    return false;
  }

  isAttributeStart(): boolean {
    return this.currentPeek() === ".";
  }

  skipToNextEntryStart(junkStart: number): void {
    let lastNewline = this.string.lastIndexOf(EOL, this.index);
    if (junkStart < lastNewline) {
      // Last seen newline is _after_ the junk start. It's safe to rewind
      // without the risk of resuming at the same broken entry.
      this.index = lastNewline;
    }
    while (this.currentChar()) {
      // We're only interested in beginnings of line.
      if (this.currentChar() !== EOL) {
        this.next();
        continue;
      }

      // Break if the first char in this line looks like an entry start.
      const first = this.next();
      if (this.isCharIdStart(first) || first === "-" || first === "#") {
        break;
      }
    }
  }

  takeIDStart(): string {
    if (this.isCharIdStart(this.currentChar())) {
      const ret = this.currentChar();
      this.next();
      return ret;
    }

    throw new ParseError("E0004", "a-zA-Z");
  }

  takeIDChar(): string | null | typeof EOF {
    const closure = (ch: string): boolean => {
      const cc = ch.charCodeAt(0);
      return (
        (cc >= 97 && cc <= 122) || // a-z
        (cc >= 65 && cc <= 90) || // A-Z
        (cc >= 48 && cc <= 57) || // 0-9
        cc === 95 ||
        cc === 45
      ); // _-
    };

    return this.takeChar(closure);
  }

  takeDigit(): string | null | typeof EOF {
    const closure = (ch: string): boolean => {
      const cc = ch.charCodeAt(0);
      return cc >= 48 && cc <= 57; // 0-9
    };

    return this.takeChar(closure);
  }

  takeHexDigit(): string | null | typeof EOF {
    const closure = (ch: string): boolean => {
      const cc = ch.charCodeAt(0);
      return (
        (cc >= 48 && cc <= 57) || // 0-9
        (cc >= 65 && cc <= 70) || // A-F
        (cc >= 97 && cc <= 102)
      ); // a-f
    };

    return this.takeChar(closure);
  }
}
