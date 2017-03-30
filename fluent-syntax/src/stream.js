export class ParserStream {
  constructor(string) {
    this.string = string;
    this.iter = string[Symbol.iterator]();
    this.buf = [];
    this.peekIndex = 0;
    this.index = 0;

    this.iterEnd = false;
    this.peekEnd = false;

    this.ch = this.iter.next().value;
  }

  next() {
    if (this.iterEnd) {
      return undefined;
    }

    if (this.buf.length === 0) {
      this.ch = this.iter.next().value;
    } else {
      this.ch = this.buf.shift();
    }

    this.index++;

    if (this.ch === undefined) {
      this.iterEnd = true;
      this.peekEnd = true;
    }

    this.peekIndex = this.index;

    return this.ch;
  }

  current() {
    return this.ch;
  }

  currentIs(ch) {
    return this.ch === ch;
  }

  currentPeek() {
    if (this.peekEnd) {
      return undefined;
    }

    const diff = this.peekIndex - this.index;

    if (diff === 0) {
      return this.ch;
    }
    return this.buf[diff - 1];
  }

  currentPeekIs(ch) {
    return this.currentPeek() === ch;
  }

  peek() {
    if (this.peekEnd) {
      return undefined;
    }

    this.peekIndex += 1;

    const diff = this.peekIndex - this.index;

    if (diff > this.buf.length) {
      const ch = this.iter.next().value;
      if (ch !== undefined) {
        this.buf.push(ch);
      } else {
        this.peekEnd = true;
        return undefined;
      }
    }

    return this.buf[diff - 1];
  }

  getIndex() {
    return this.index;
  }

  getPeekIndex() {
    return this.peekIndex;
  }

  peekCharIs(ch) {
    if (this.peekEnd) {
      return false;
    }

    const ret = this.peek();

    this.peekIndex -= 1;

    return ret === ch;
  }

  resetPeek() {
    this.peekIndex = this.index;
    this.peekEnd = this.iterEnd;
  }

  skipToPeek() {
    const diff = this.peekIndex - this.index;

    for (let i = 0; i < diff; i++) {
      this.ch = this.buf.shift();
    }

    this.index = this.peekIndex;
  }

  getSlice(start, end) {
    return this.string.substring(start, end);
  }
}
