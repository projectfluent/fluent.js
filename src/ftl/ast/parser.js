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
    ps.skipWSLines();
  }

  return [new AST.Resource(entries), errors];
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

  return comment;
}

function getComment(ps) {
  ps.expectChar('#');
  ps.takeCharIf(' ');

  let content = '';

  while(true) {
    let ch;
    while (ch = ps.takeChar(x => x !== '\n')) {
      content += ch;
    }

    ps.next();

    if (ps.current() == '#') {
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

  let key = getKeyword(ps);

  ps.skipLineWS();

  ps.expectChar(']');
  ps.expectChar(']');

  ps.skipLineWS();

  ps.expectChar('\n');

  return new AST.Section(key, comment);
}

function getMessage(ps, comment) {
  let id = getIdentifier(ps);

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
    throw new Error('MissingField');
  }

  return new AST.Message(id, pattern, attrs, comment);
}

function getAttributes(ps) {
  let attrs = [];

  while(true) {
    ps.expectChar('\n');
    ps.skipLineWS();

    ps.expectChar('.');

    let key = getIdentifier(ps);

    ps.skipLineWS();

    ps.expectChar('=');

    ps.skipLineWS();

    let value = getPattern(ps);

    if (value === undefined) {
      throw new Error('ExpectedField');
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

  while (ch = ps.takeIDChar()) {
    name += ch;
  }

  return new AST.Identifier(name);
}

function getVariantKey(ps) {
  let ch = ps.current();

  if (!ch) {
    throw new Error('Expected VariantKey');
  }

  let cc = ch.charCodeAt(0);

  if ((cc >= 48 && cc <= 57) || cc === 45) { // 0-9, -
    return getNumber(ps);
  } else {
    return getKeyword(ps);
  }
}

function getVariants(ps) {
  let variants = [];
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

    let key = getVariantKey(ps);

    ps.expectChar(']');

    ps.skipLineWS();

    let value = getPattern(ps);

    if (!value) {
      throw new Error('ExpectedField');
    }

    variants.push(new AST.Variant(key, value, defaultIndex));

    if (!ps.isPeekNextLineVariantStart()) {
      break;
    }
  }

  if (!hasDefault) {
    throw new Error('MissingDefaultVariant');
  }

  return variants;
}

function getKeyword(ps) {
  let name = '';

  name += ps.takeIDStart();

  while (true) {
    let ch = ps.takeKWChar();
    if (ch) {
      name += ch;
    } else {
      break;
    }
  }

  name.trimRight();
}

function getPattern(ps) {
  let buffer = '';
  let elements = [];
  let quoteDelimited = false;
  let quoteOpen = false;
  let firstLine = true;
  let isIndented = false;

  if (ps.takeCharIf('"')) {
    quoteDelimited = true;
    quoteOpen = true;
  }

  let ch;
  while (ch = ps.current()) {
    if (ch == '\n') {
      if (quoteDelimited) {
        throw new Error('ExpectedToken');
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
          throw new Error('Generic');
        }
      }

      firstLine = false;

      if (buffer.length !== 0) {
        buffer += ch;
      }
      continue;
    } else if (ch === '\\') {
      let ch2 = ps.peek();
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
    let variants = getVariants(ps);

    ps.expectChar('\n');

    return new AST.SelectExpression(null, variants);
  }

  let selector = getSelectorExpression(ps);

  ps.skipLineWS();

  if (ps.currentIs('-')) {
    ps.peek();
    if (!ps.currentPeekIs('>')) {
      ps.resetPeek();
    } else {
      ps.next();
      ps.next();

      ps.skipLineWS();

      let variants = getVariants(ps);

      if (variants.length === 0) {
        throw new Error('MissingVariants');
      }

      ps.expectChar('\n');

      return new AST.SelectExpression(selector, variants);
    }
  }

  return selector;
}

function getSelectorExpression(ps) {
  let literal = getLiteral(ps);

  if (literal.type !== 'MessageReference') {
    return literal;
  }

  let ch = ps.current();

  if (ch === '.') {
    ps.next();

    let attr = getIdentifier(ps);
    return new AST.AttributeExpression(literal.id, attr);
  }

  if (ch === '[') {
    ps.next();

    let key  = getVariantKey(ps);

    ps.expectChar(']');

    return new AST.VariantExpression(literal.id, key);
  }

  if (ch === '(') {
    ps.next();

    let args = getCallArgs(ps);

    ps.expectChar(')');

    return new AST.CallExpression(literal.id, args);
  }

  return literal;
}

function getCallAtrs(ps) {
  let args = [];

  ps.skipLineWS();

  while(true) {
    if (ps.current() == ')') {
      break;
    }

    let exp = getSelectorExpression(ps);

    ps.skipLineWS();

    if (ps.current() == ':') {
      if (exp.type !== 'MessageReference') {
        throw new Error('ForbiddenKey');
      }

      ps.next();
      ps.skipLineWS();

      let val = getArgVal(ps);

      args.push(new AST.NamedArgument(exp.id, val));
    } else {
      args.push(exp);
    }
  }
}

function getLiteral(ps) {
  let ch = ps.current();

  if (!ch) {
    throw new Error('Expected literal');
  }

  let cc = ch.charCodeAt(0);

  if ((cc >= 48 && cc <= 57) || cc === 45) { // 0-9, -
    return getNumber(ps);
  } else if (cc === 34) { // "
    return getPattern(ps);
  } else if (cc === 36) { // $
    ps.next();
    let name = getIdentifier(ps);
    return new AST.ExternalArgument(name);
  }

  let name = getIdentifier(ps);
  return new AST.MessageReference(name);

}

export default {
  parse
};
