import { ParserStream } from './iter';

export class FTLParserStream extends ParserStream {
  peekLineWS() {
    let ch;
    while (ch = this.currentPeek()) {
      if (ch !== ' ' && ch !== '\t') {
        break;
      }
      this.peek();
    }
  }

  skipWSLines() {
    
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
      return true;
    }

    throw new Error(`ExpectedToken ${ch}`);
  }

  takeCharIf(ch) {
    if (this.ch === ch) {
      this.next();
      return true;
    }
    return false;
  }

  takeChar(f) {
    let ch = this.ch;
    if (f(ch)) {
      this.next();
      return ch;
    }
    return undefined;
  }

  isIDStart() {
    let cc = this.ch.charCodeAt(0);
    return ((cc >= 97 && cc <= 122) || // a-z
            (cc >= 65 && cc <= 90) ||  // A-Z
             cc === 95);               // _
  }

  takeIDStart() {
    if (this.isIDStart()) {
      let ret = this.ch;
      this.next();
      return ret;
    }
    throw new Error('ExpectedCharRange');
  }

  takeIDChar() {
    let closure = ch => {
      let cc = this.ch.charCodeAt(0);
      return ((cc >= 97 && cc <= 122) || // a-z
              (cc >= 65 && cc <= 90) ||  // A-Z
               cc === 95);               // _
    };

    return this.takeChar(closure);
  }
}
