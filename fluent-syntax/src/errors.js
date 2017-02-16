class Annotation {
  constructor(message) {
    this.message = message;
  }
}

export class ParseError extends Annotation {
  constructor(message) {
    super(message);
    this.name = 'ParseError';
  }
}

export function error(ps, message) {
  const err = new ParseError(message);
  err.pos = ps.getIndex();
  return err;
}
