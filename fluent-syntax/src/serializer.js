import { includes } from './util';

function indent(content) {
  return content.split('\n').join('\n    ');
}

function containNewLine(elems) {
  const withNewLine = elems.filter(
    elem => (elem.type === 'TextElement' && includes(elem.value, '\n'))
  );
  return !!withNewLine.length;
}

export default class FluentSerializer {
  constructor({ withJunk = false } = {}) {
    this.withJunk = withJunk;
  }

  serialize(resource) {
    const parts = [];

    if (resource.comment) {
      parts.push(
        `${serializeComment(resource.comment)}\n\n`
      );
    }

    for (const entry of resource.body) {
      if (entry.types !== 'Junk' || this.withJunk) {
        parts.push(this.serializeEntry(entry));
      }
    }

    return parts.join('');
  }

  serializeEntry(entry) {
    switch (entry.type) {
      case 'Message':
        return serializeMessage(entry);
      case 'Section':
        return serializeSection(entry);
      case 'Comment': {
        const comment = serializeComment(entry);
        return `\n${comment}\n\n`;
      }
      case 'Junk':
        return serializeJunk(entry);
      default :
        throw new Error(`Unknown entry type: ${entry.type}`);
    }
  }
}


function serializeComment(comment) {
  return comment.content.split('\n').map(
    line => `// ${line}`
  ).join('\n');
}


function serializeSection(section) {
  const name = serializeSymbol(section.name);

  if (section.comment) {
    const comment = serializeComment(section.comment);
    return `\n\n${comment}\n[[ ${name} ]]\n\n`;
  }

  return `\n\n[[ ${name} ]]\n\n`;
}


function serializeJunk(junk) {
  return junk.content;
}


function serializeMessage(message) {
  const parts = [];

  if (message.comment) {
    parts.push(serializeComment(message.comment));
    parts.push('\n');
  }

  parts.push(serializeIdentifier(message.id));

  if (message.value) {
    parts.push(' =');
    parts.push(serializeValue(message.value));
  }

  for (const tag of message.tags) {
    parts.push(serializeTag(tag));
  }

  for (const attribute of message.attributes) {
    parts.push(serializeAttribute(attribute));
  }

  parts.push('\n');
  return parts.join('');
}


function serializeTag(tag) {
  const name = serializeSymbol(tag.name);
  return `\n    #${name}`;
}


function serializeAttribute(attribute) {
  const id = serializeIdentifier(attribute.id);
  const value = indent(serializeValue(attribute.value));
  return `\n    .${id} =${value}`;
}


function serializeValue(pattern) {
  const content = indent(serializePattern(pattern));
  const multi = containNewLine(pattern.elements);

  if (multi) {
    return `\n    ${content}`;
  }

  return ` ${content}`;
}


function serializePattern(pattern) {
  return pattern.elements.map(serializeElement).join('');
}


function serializeElement(element) {
  switch (element.type) {
    case 'TextElement':
      return serializeTextElement(element);
    case 'Placeable':
      return serializePlaceable(element);
    default:
      throw new Error(`Unknown element type: ${element.type}`);
  }
}


function serializeTextElement(text) {
  return text.value;
}


function serializePlaceable(placeable) {
  const expr = placeable.expression;

  switch (expr.type) {
    case 'Placeable':
      return `{${serializePlaceable(expr)}}`;
    case 'SelectExpression':
      return `{${serializeSelectExpression(expr)}}`;
    default:
      return `{ ${serializeExpression(expr)} }`;
  }
}


function serializeExpression(expr) {
  switch (expr.type) {
    case 'StringExpression':
      return serializeStringExpression(expr);
    case 'NumberExpression':
      return serializeNumberExpression(expr);
    case 'MessageReference':
      return serializeMessageReference(expr);
    case 'ExternalArgument':
      return serializeExternalArgument(expr);
    case 'AttributeExpression':
      return serializeAttributeExpression(expr);
    case 'VariantExpression':
      return serializeVariantExpression(expr);
    case 'CallExpression':
      return serializeCallExpression(expr);
    default:
      throw new Error(`Unknown expression type: ${expr.type}`);
  }
}


function serializeStringExpression(expr) {
  return `"${expr.value}"`;
}


function serializeNumberExpression(expr) {
  return expr.value;
}


function serializeMessageReference(expr) {
  return serializeIdentifier(expr.id);
}


function serializeExternalArgument(expr) {
  return `$${serializeIdentifier(expr.id)}`;
}


function serializeSelectExpression(expr) {
  const parts = [];

  if (expr.expression) {
    const selector = ` ${serializeExpression(expr.expression)} ->`;
    parts.push(selector);
  }

  for (const variant of expr.variants) {
    parts.push(serializeVariant(variant));
  }

  parts.push('\n');
  return parts.join('');
}


function serializeVariant(variant) {
  const key = serializeVariantKey(variant.key);
  const value = indent(serializeValue(variant.value));

  if (variant.default) {
    return `\n   *[${key}]${value}`;
  }

  return `\n    [${key}]${value}`;
}


function serializeAttributeExpression(expr) {
  const id = serializeIdentifier(expr.id);
  const name = serializeIdentifier(expr.name);
  return `${id}.${name}`;
}


function serializeVariantExpression(expr) {
  const id = serializeIdentifier(expr.id);
  const key = serializeVariantKey(expr.key);
  return `${id}[${key}]`;
}


function serializeCallExpression(expr) {
  const fun = serializeFunction(expr.callee);
  const args = expr.args.map(serializeCallArgument).join(', ');
  return `${fun}(${args})`;
}


function serializeCallArgument(arg) {
  switch (arg.type) {
    case 'NamedArgument':
      return serializeNamedArgument(arg);
    default:
      return serializeExpression(arg);
  }
}


function serializeNamedArgument(arg) {
  const name = serializeIdentifier(arg.name);
  const value = serializeArgumentValue(arg.val);
  return `${name}: ${value}`;
}


function serializeArgumentValue(argval) {
  switch (argval.type) {
    case 'StringExpression':
      return serializeStringExpression(argval);
    case 'NumberExpression':
      return serializeNumberExpression(argval);
    default:
      throw new Error(`Unknown argument type: ${argval.type}`);
  }
}


function serializeIdentifier(identifier) {
  return identifier.name;
}


function serializeSymbol(symbol) {
  return symbol.name;
}


function serializeVariantKey(key) {
  switch (key.type) {
    case 'Symbol':
      return serializeSymbol(key);
    case 'NumberExpression':
      return serializeNumberExpression(key);
    default:
      throw new Error(`Unknown variant key type: ${key.type}`);
  }
}


function serializeFunction(fun) {
  return fun.name;
}
