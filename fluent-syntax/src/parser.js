/*  eslint no-magic-numbers: [0]  */

import * as AST from './ast';
import { FTLParserStream } from './ftlstream';
import { ParseError, error } from './errors';

export function parse(source) {
  let comment = null;

  const ps = new FTLParserStream(source);

  ps.skipWSLines();

  const entries = [];

  while (ps.current()) {
    const entryStartPos = ps.getIndex();

    try {
      const entry = getEntry(ps);
      if (entryStartPos === 0 && entry.type === 'Comment') {
        comment = entry;
      } else {
        entry.addSpan(entryStartPos, ps.getIndex());
        entries.push(entry);
      }
    } catch (err) {
      if (!(err instanceof ParseError)) {
        throw err;
      }

      ps.skipToNextEntryStart();
      const nextEntryStart = ps.getIndex();

      // Create a Junk instance
      const slice = source.substring(entryStartPos, nextEntryStart);
      const junk = new AST.Junk(slice);
      junk.addSpan(entryStartPos, nextEntryStart);
      junk.addAnnotation(err);
      entries.push(junk);
    }

    ps.skipWSLines();
  }

  return new AST.Resource(entries, comment, source);
}

function getEntry(ps) {
  let comment;

  if (ps.currentIs('#')) {
    comment = getComment(ps);
  }

  if (ps.currentIs('[')) {
    return getSection(ps, comment);
  }

  if (ps.isIDStart()) {
    return getMessage(ps, comment);
  }

  if (comment) {
    return comment;
  }
  throw error(ps, 'Expected entry');
}

function getComment(ps) {
  ps.expectChar('#');
  ps.takeCharIf(' ');

  let content = '';

  while (true) {
    let ch;
    while ((ch = ps.takeChar(x => x !== '\n'))) {
      content += ch;
    }

    ps.next();

    if (ps.current() === '#') {
      content += '\n';
      ps.next();
      ps.takeCharIf(' ');
    } else {
      break;
    }
  }
  return new AST.Comment(content);
}

function getSection(ps, comment) {
  ps.expectChar('[');
  ps.expectChar('[');

  ps.skipLineWS();

  const key = getKeyword(ps);

  ps.skipLineWS();

  ps.expectChar(']');
  ps.expectChar(']');

  ps.skipLineWS();

  ps.expectChar('\n');

  return new AST.Section(key, comment);
}

function getMessage(ps, comment) {
  const id = getIdentifier(ps);

  ps.skipLineWS();

  let pattern;
  let attrs;

  if (ps.currentIs('=')) {
    ps.next();
    ps.skipLineWS();

    pattern = getPattern(ps);
  }

  if (ps.isPeekNextLineAttributeStart()) {
    attrs = getAttributes(ps);
  }

  if (pattern === undefined && attrs === undefined) {
    throw error(ps, 'Missing field');
  }

  return new AST.Message(id, pattern, attrs, comment);
}

function getAttributes(ps) {
  const attrs = [];

  while (true) {
    ps.expectChar('\n');
    ps.skipLineWS();

    ps.expectChar('.');

    const key = getIdentifier(ps);

    ps.skipLineWS();

    ps.expectChar('=');

    ps.skipLineWS();

    const value = getPattern(ps);

    if (value === undefined) {
      throw error(ps, 'Expected field');
    }

    attrs.push(new AST.Attribute(key, value));

    if (!ps.isPeekNextLineAttributeStart()) {
      break;
    }
  }
  return attrs;
}

function getIdentifier(ps) {
  let name = '';

  name += ps.takeIDStart();

  let ch;
  while ((ch = ps.takeIDChar())) {
    name += ch;
  }

  return new AST.Identifier(name);
}

function getVariantKey(ps) {
  const ch = ps.current();

  if (!ch) {
    throw error(ps, 'Expected VariantKey');
  }

  const cc = ch.charCodeAt(0);

  if ((cc >= 48 && cc <= 57) || cc === 45) { // 0-9, -
    return getNumber(ps);
  }

  return getKeyword(ps);
}

function getVariants(ps) {
  const variants = [];
  let hasDefault = false;

  while (true) {
    let defaultIndex = false;

    ps.expectChar('\n');
    ps.skipLineWS();

    if (ps.currentIs('*')) {
      ps.next();
      defaultIndex = true;
      hasDefault = true;
    }

    ps.expectChar('[');

    const key = getVariantKey(ps);

    ps.expectChar(']');

    ps.skipLineWS();

    const value = getPattern(ps);

    if (!value) {
      throw error(ps, 'Expected field');
    }

    variants.push(new AST.Variant(key, value, defaultIndex));

    if (!ps.isPeekNextLineVariantStart()) {
      break;
    }
  }

  if (!hasDefault) {
    throw error(ps, 'Missing default variant');
  }

  return variants;
}

function getKeyword(ps) {
  let name = '';

  name += ps.takeIDStart();

  while (true) {
    const ch = ps.takeKWChar();
    if (ch) {
      name += ch;
    } else {
      break;
    }
  }

  return new AST.Keyword(name.trimRight());
}

function getDigits(ps) {
  let num = '';

  let ch;
  while ((ch = ps.takeDigit())) {
    num += ch;
  }

  if (num.length === 0) {
    throw error(ps, 'Expected char range');
  }

  return num;
}

function getNumber(ps) {
  let num = '';

  if (ps.currentIs('-')) {
    num += '-';
    ps.next();
  }

  num = `${num}${getDigits(ps)}`;

  if (ps.currentIs('.')) {
    num += '.';
    ps.next();
    num = `${num}${getDigits(ps)}`;
  }

  return new AST.NumberExpression(num);
}

function getPattern(ps) {
  let buffer = '';
  const elements = [];
  let quoteDelimited = false;
  let quoteOpen = false;
  let firstLine = true;
  let isIndented = false;

  if (ps.takeCharIf('"')) {
    quoteDelimited = true;
    quoteOpen = true;
  }

  let ch;
  while ((ch = ps.current())) {
    if (ch === '\n') {
      if (quoteDelimited) {
        throw error(ps, 'Expected roken');
      }

      if (firstLine && buffer.length !== 0) {
        break;
      }

      ps.peek();

      ps.peekLineWS();

      if (!ps.currentPeekIs('|')) {
        ps.resetPeek();
        break;
      } else {
        ps.skipToPeek();
        ps.next();
      }

      if (firstLine) {
        if (ps.takeCharIf(' ')) {
          isIndented = true;
        }
      } else {
        if (isIndented && !ps.takeCharIf(' ')) {
          throw error(ps, 'Generic');
        }
      }

      firstLine = false;

      if (buffer.length !== 0) {
        buffer += ch;
      }
      continue;
    } else if (ch === '\\') {
      const ch2 = ps.peek();
      if (ch2 === '{' || ch2 === '"') {
        buffer += ch2;
      } else {
        buffer += ch + ch2;
      }
      ps.next();
    } else if (ch === '{') {
      ps.next();

      ps.skipLineWS();

      if (buffer.length !== 0) {
        elements.push(new AST.StringExpression(buffer));
      }

      buffer = '';

      elements.push(getExpression(ps));

      ps.expectChar('}');

      continue;
    } else if (ch === '"' && quoteOpen) {
      ps.next();
      quoteOpen = false;
      break;
    } else {
      buffer += ps.ch;
    }
    ps.next();
  }

  if (buffer.length !== 0) {
    elements.push(new AST.StringExpression(buffer));
  }

  return new AST.Pattern(elements, false);
}

function getExpression(ps) {
  if (ps.isPeekNextLineVariantStart()) {
    const variants = getVariants(ps);

    ps.expectChar('\n');

    return new AST.SelectExpression(null, variants);
  }

  const selector = getSelectorExpression(ps);

  ps.skipLineWS();

  if (ps.currentIs('-')) {
    ps.peek();
    if (!ps.currentPeekIs('>')) {
      ps.resetPeek();
    } else {
      ps.next();
      ps.next();

      ps.skipLineWS();

      const variants = getVariants(ps);

      if (variants.length === 0) {
        throw error(ps, 'Missing variants');
      }

      ps.expectChar('\n');

      return new AST.SelectExpression(selector, variants);
    }
  }

  return selector;
}

function getSelectorExpression(ps) {
  const literal = getLiteral(ps);

  if (literal.type !== 'MessageReference') {
    return literal;
  }

  const ch = ps.current();

  if (ch === '.') {
    ps.next();

    const attr = getIdentifier(ps);
    return new AST.AttributeExpression(literal.id, attr);
  }

  if (ch === '[') {
    ps.next();

    const key = getVariantKey(ps);

    ps.expectChar(']');

    return new AST.VariantExpression(literal.id, key);
  }

  if (ch === '(') {
    ps.next();

    const args = getCallArgs(ps);

    ps.expectChar(')');

    return new AST.CallExpression(literal.id, args);
  }

  return literal;
}

function getCallArgs(ps) {
  const args = [];

  ps.skipLineWS();

  while (true) {
    if (ps.current() === ')') {
      break;
    }

    const exp = getSelectorExpression(ps);

    ps.skipLineWS();

    if (ps.current() === ':') {
      if (exp.type !== 'MessageReference') {
        throw error(ps, 'Forbidden key');
      }

      ps.next();
      ps.skipLineWS();

      const val = getArgVal(ps);

      args.push(new AST.NamedArgument(exp.id, val));
    } else {
      args.push(exp);
    }

    ps.skipLineWS();

    if (ps.current() === ',') {
      ps.next();
      ps.skipLineWS();
      continue;
    } else {
      break;
    }
  }
  return args;
}

function getArgVal(ps) {
  if (ps.isNumberStart()) {
    return getNumber(ps);
  } else if (ps.currentIs('"')) {
    return getString(ps);
  }
  throw error(ps, 'Expected field');
}

function getString(ps) {
  let val = '';

  ps.expectChar('"');

  let ch;
  while ((ch = ps.takeChar(x => x !== '"'))) {
    val += ch;
  }

  ps.next();

  return new AST.StringExpression(val);

}

function getLiteral(ps) {
  const ch = ps.current();

  if (!ch) {
    throw error(ps, 'Expected literal');
  }

  if (ps.isNumberStart()) {
    return getNumber(ps);
  } else if (ch === '"') {
    return getPattern(ps);
  } else if (ch === '$') {
    ps.next();
    const name = getIdentifier(ps);
    return new AST.ExternalArgument(name);
  }

  const name = getIdentifier(ps);
  return new AST.MessageReference(name);

}
