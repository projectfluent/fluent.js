export class ParserStream {
  constructor(string) {
    this.string = string;
    this.index = 0;
    this.peekOffset = 0;
  }

  get currentChar() {
    return this.string[this.index];
  }

  get currentPeek() {
    return this.string[this.index + this.peekOffset];
  }

  next() {
    this.index++;
    this.peekOffset = 0;
    return this.string[this.index];
  }

  peek() {
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
