export class ParseError extends Error {
  constructor(code, ...args) {
    super();
    this.code = code;
    this.args = args;
    this.message = getErrorMessage(code, args);
  }
}

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
      return `Expected entry "${id}" to have a value, attributes or tags`;
    }
    case 'E0006': {
      const [field] = args;
      return `Expected field: "${field}"`;
    }
    case 'E0007':
      return 'Keyword cannot end with a whitespace';
    case 'E0008':
      return 'Callee has to be a simple identifier';
    case 'E0009':
      return 'Key has to be a simple identifier';
    case 'E0010':
      return 'Expected one of the variants to be marked as default (*)';
    case 'E0011':
      return 'Expected at least one variant after "->"';
    case 'E0012':
      return 'Tags cannot be added to messages with attributes';
    case 'E0013':
      return 'Expected variant key';
    case 'E0014':
      return 'Expected literal';
    default:
      return code;
  }
}
