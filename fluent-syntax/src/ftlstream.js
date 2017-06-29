/* eslint no-magic-numbers: "off" */

import { ParserStream } from './stream';
import { ParseError } from './errors';

export class FTLParserStream extends ParserStream {
  peekLineWS() {
    let ch = this.currentPeek();
    while (ch) {
      if (ch !== ' ' && ch !== '\t') {
        break;
      }
      ch = this.peek();
    }
  }

  skipWSLines() {
    while (true) {
      this.peekLineWS();

      if (this.currentPeek() === '\n') {
        this.skipToPeek();
        this.next();
      } else {
        this.resetPeek();
        break;
      }
    }
  }

  skipLineWS() {
    while (this.ch) {
      if (this.ch !== ' ' && this.ch !== '\t') {
        break;
      }
      this.next();
    }
  }

  expectChar(ch) {
    if (this.ch === ch) {
      this.next();
      return true;
    }

    if (ch === '\n') {
      // Unicode Character 'SYMBOL FOR NEWLINE' (U+2424)
      throw new ParseError('E0003', '\u2424');
    }

    throw new ParseError('E0003', ch);
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

  isIDStart() {
    if (this.ch === undefined) {
      return false;
    }

    const cc = this.ch.charCodeAt(0);
    return ((cc >= 97 && cc <= 122) || // a-z
            (cc >= 65 && cc <= 90) ||  // A-Z
             cc === 95);               // _
  }

  isNumberStart() {
    const cc = this.ch.charCodeAt(0);
    return ((cc >= 48 && cc <= 57) || cc === 45); // 0-9
  }

  isPeekNextLineIndented() {
    if (!this.currentPeekIs('\n')) {
      return false;
    }

    this.peek();

    if (this.currentPeekIs(' ')) {
      this.resetPeek();
      return true;
    }

    this.resetPeek();
    return false;
  }

  isPeekNextLineVariantStart() {
    if (!this.currentPeekIs('\n')) {
      return false;
    }

    this.peek();

    const ptr = this.getPeekIndex();

    this.peekLineWS();

    if (this.getPeekIndex() - ptr === 0) {
      this.resetPeek();
      return false;
    }

    if (this.currentPeekIs('*')) {
      this.peek();
    }

    if (this.currentPeekIs('[') && !this.peekCharIs('[')) {
      this.resetPeek();
      return true;
    }
    this.resetPeek();
    return false;
  }

  isPeekNextLineAttributeStart() {
    if (!this.currentPeekIs('\n')) {
      return false;
    }

    this.peek();

    const ptr = this.getPeekIndex();

    this.peekLineWS();

    if (this.getPeekIndex() - ptr === 0) {
      this.resetPeek();
      return false;
    }

    if (this.currentPeekIs('.')) {
      this.resetPeek();
      return true;
    }

    this.resetPeek();
    return false;
  }

  isPeekNextLinePattern() {
    if (!this.currentPeekIs('\n')) {
      return false;
    }

    this.peek();

    const ptr = this.getPeekIndex();

    this.peekLineWS();

    if (this.getPeekIndex() - ptr === 0) {
      this.resetPeek();
      return false;
    }

    if (this.currentPeekIs('}') ||
        this.currentPeekIs('.') ||
        this.currentPeekIs('#') ||
        this.currentPeekIs('[') ||
        this.currentPeekIs('*')) {
      this.resetPeek();
      return false;
    }

    this.resetPeek();
    return true;
  }

  isPeekNextLineTagStart() {
    if (!this.currentPeekIs('\n')) {
      return false;
    }

    this.peek();

    const ptr = this.getPeekIndex();

    this.peekLineWS();

    if (this.getPeekIndex() - ptr === 0) {
      this.resetPeek();
      return false;
    }

    if (this.currentPeekIs('#')) {
      this.resetPeek();
      return true;
    }

    this.resetPeek();
    return false;
  }

  skipToNextEntryStart() {
    while (this.next()) {
      if (this.currentIs('\n') && !this.peekCharIs('\n')) {
        this.next();
        if (this.ch === undefined || this.isIDStart() ||
            (this.currentIs('/') && this.peekCharIs('/')) ||
            (this.currentIs('[') && this.peekCharIs('['))) {
          break;
        }
      }
    }
  }

  takeIDStart() {
    if (this.isIDStart()) {
      const ret = this.ch;
      this.next();
      return ret;
    }
    throw new ParseError('E0004', 'a-zA-Z_');
  }

  takeIDChar() {
    const closure = ch => {
      const cc = ch.charCodeAt(0);
      return ((cc >= 97 && cc <= 122) || // a-z
              (cc >= 65 && cc <= 90) || // A-Z
              (cc >= 48 && cc <= 57) || // 0-9
               cc === 95 || cc === 45);  // _-
    };

    return this.takeChar(closure);
  }

  takeSymbChar() {
    const closure = ch => {
      const cc = ch.charCodeAt(0);
      return ((cc >= 97 && cc <= 122) || // a-z
              (cc >= 65 && cc <= 90) || // A-Z
              (cc >= 48 && cc <= 57) || // 0-9
               cc === 95 || cc === 45 || cc === 32);  // _-<space>
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
