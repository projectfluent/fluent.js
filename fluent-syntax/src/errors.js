export class ParseError extends Error {
  constructor(code, ...args) {
    super();
    this.code = code;
    this.args = args;
    this.message = getErrorMessage(code, args);
  }
}

/* eslint-disable complexity */
function getErrorMessage(code, args) {
  switch (code) {
    case 'E0001':
      return 'Generic error';
    case 'E0002':
      return 'Expected an entry start';
    case 'E0003': {
      const [token] = args;
      return `Expected token: "${token}"`;
    }
    case 'E0004': {
      const [range] = args;
      return `Expected a character from range: "${range}"`;
    }
    case 'E0005': {
      const [id] = args;
      return `Expected entry "${id}" to have a value or attributes`;
    }
    case 'E0006': {
      const [field] = args;
      return `Expected field: "${field}"`;
    }
    case 'E0007':
      return 'Keyword cannot end with a whitespace';
    case 'E0008':
      return 'The callee has to be a simple, upper-case identifier';
    case 'E0009':
      return 'The key has to be a simple identifier';
    case 'E0010':
      return 'Expected one of the variants to be marked as default (*)';
    case 'E0011':
      return 'Expected at least one variant after "->"';
    case 'E0013':
      return 'Expected variant key';
    case 'E0014':
      return 'Expected literal';
    case 'E0015':
      return 'Only one variant can be marked as default (*)';
    case 'E0016':
      return 'Message references cannot be used as selectors';
    case 'E0017':
      return 'Variants cannot be used as selectors';
    case 'E0018':
      return 'Attributes of public messages cannot be used as selectors';
    case 'E0019':
      return 'Attributes of private messages cannot be used as placeables';
    default:
      return code;
  }
}
