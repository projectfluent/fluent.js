/*  eslint no-magic-numbers: [0]  */

import AST from './ast';
import { L10nError } from '../../lib/errors';
import { FTLParserStream } from './stream';

function parse(source) {
  let errors = [];
  let comment = null;

  let ps = new FTLParserStream(source);

  ps.skipWSLines();

  let entries = [];

  while (ps.current()) {
    let entryStartPos = ps.getIndex();

    let entry = getEntry(ps);

    if (entry) {
      entries.push(entry);
    }
  }

  return [new AST.Resource(entries), errors];
}

function getEntry(ps) {
  let comment;

  if (ps.currentIs('#')) {
    comment = getComment(ps);
  }

  if (ps.isIDStart()) {
    return getMessage(ps, comment);
  }
}

function getMessage(ps, comment) {
  let id = getIdentifier(ps);

  ps.skipLineWS();

  let pattern;
  if (ps.currentIs('=')) {
    ps.next();
    ps.skipLineWS();

    pattern = getPattern(ps);

    return new AST.Message(id, pattern);
  }
}

function getIdentifier(ps) {
  let name = '';

  name += ps.takeIDStart();

  let ch;

  while (ch = ps.takeIDChar()) {
    name += ch;
  }

  return new AST.Identifier(name);
}

function getPattern(ps) {
  let buffer = '';
  let elements = [];
  let quoteDelimited = false;
  let quoteOpen = false;
  let firstLine = true;
  let isIndented = false;

  while (ps.ch) {
    switch (ps.current()) {
      case '\n':
        if (quoteDelimited) {
          throw new Error('ExpectedToken');
        }

        if (firstLine && buffer.length !== 0) {
          break;
        }
      default:
        buffer += ps.ch;
    }
    ps.next();
  }

  if (buffer.length !== 0) {
    elements.push(new AST.StringExpression(buffer));
  }

  return new AST.Pattern(elements, false);
}

export default {
  parse
}
