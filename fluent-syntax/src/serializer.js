import { includes } from "./util";

const DEFAULT_INDENT = 4;

function indent(level, shift = 0) {
  return " ".repeat(level * DEFAULT_INDENT + shift);
}

function includesNewLine(elem) {
  return elem.type === "TextElement" && includes(elem.value, "\n");
}

function isSelectExpr(elem) {
  return elem.type === "Placeable"
    && elem.expression.type === "SelectExpression";
}

// Bit masks representing the state of the serializer.
export const HAS_ENTRIES = 1;

export default class FluentSerializer {
  constructor({ withJunk = false } = {}) {
    this.withJunk = withJunk;
  }

  serialize(resource) {
    if (resource.type !== "Resource") {
      throw new Error(`Unknown resource type: ${resource.type}`);
    }

    let state = 0;
    const parts = [];

    for (const entry of resource.body) {
      if (entry.type !== "Junk" || this.withJunk) {
        parts.push(this.serializeEntry(entry, state));
        if (!(state & HAS_ENTRIES)) {
          state |= HAS_ENTRIES;
        }
      }
    }

    return parts.join("");
  }

  serializeEntry(entry, state = 0) {
    switch (entry.type) {
      case "Message":
      case "Term":
        return serializeMessage(entry);
      case "Comment":
        if (state & HAS_ENTRIES) {
          return `\n${serializeComment(entry)}\n\n`;
        }
        return `${serializeComment(entry)}\n\n`;
      case "GroupComment":
        if (state & HAS_ENTRIES) {
          return `\n${serializeGroupComment(entry)}\n\n`;
        }
        return `${serializeGroupComment(entry)}\n\n`;
      case "ResourceComment":
        if (state & HAS_ENTRIES) {
          return `\n${serializeResourceComment(entry)}\n\n`;
        }
        return `${serializeResourceComment(entry)}\n\n`;
      case "Junk":
        return serializeJunk(entry);
      default :
        throw new Error(`Unknown entry type: ${entry.type}`);
    }
  }

  serializeExpression(expr) {
    return serializeExpression(expr);
  }
}


function serializeComment(comment) {
  return comment.content.split("\n").map(
    line => line.length ? `# ${line}` : "#"
  ).join("\n");
}


function serializeGroupComment(comment) {
  return comment.content.split("\n").map(
    line => line.length ? `## ${line}` : "##"
  ).join("\n");
}


function serializeResourceComment(comment) {
  return comment.content.split("\n").map(
    line => line.length ? `### ${line}` : "###"
  ).join("\n");
}


function serializeJunk(junk) {
  return junk.content;
}


function serializeMessage(message) {
  const parts = [];

  if (message.comment) {
    parts.push(serializeComment(message.comment));
    parts.push("\n");
  }

  parts.push(serializeIdentifier(message.id));
  parts.push(" =");

  if (message.value) {
    parts.push(serializeValue(message.value, 1));
  }

  for (const attribute of message.attributes) {
    parts.push(serializeAttribute(attribute));
  }

  parts.push("\n");
  return parts.join("");
}


function serializeAttribute(attribute) {
  const id = serializeIdentifier(attribute.id);
  const value = serializeValue(attribute.value, 2);
  return `\n    .${id} =${value}`;
}


function serializeValue(value, level = 1) {
  switch (value.type) {
    case "Pattern":
      return serializePattern(value, level);
    case "VariantList":
      return serializeVariantList(value, level);
    default:
      throw new Error(`Unknown value type: ${value.type}`);
  }
}


function serializePattern(pattern, level) {
  const content = pattern.elements.map(
    element => serializeElement(element, level)).join("");
  const startOnNewLine =
    pattern.elements.some(isSelectExpr) ||
    pattern.elements.some(includesNewLine);

  if (startOnNewLine) {
    return `\n${indent(level)}${content}`;
  }

  return ` ${content}`;
}


function serializeVariantList(varlist, level) {
  const content = varlist.variants.map(
    variant => serializeVariant(variant, level + 1)).join("");
  return `\n${indent(level)}{${content}\n${indent(level)}}`;
}


function serializeVariant(variant, level) {
  const key = serializeVariantKey(variant.key);
  const value = serializeValue(variant.value, level + 1);

  if (variant.default) {
    return `\n${indent(level, -1)}*[${key}]${value}`;
  }

  return `\n${indent(level)}[${key}]${value}`;
}


function serializeElement(element, level) {
  switch (element.type) {
    case "TextElement":
      return serializeTextElement(element);
    case "Placeable":
      return serializePlaceable(element, level);
    default:
      throw new Error(`Unknown element type: ${element.type}`);
  }
}


function serializeTextElement(text) {
  return text.value;
}


function serializePlaceable(placeable, level) {
  const expr = placeable.expression;

  switch (expr.type) {
    case "Placeable":
      return `{${serializePlaceable(expr)}}`;
    case "SelectExpression":
      // Special-case select expression to control the whitespace around the
      // opening and the closing brace.
      return `{ ${serializeSelectExpression(expr, level)}${indent(level)}}`;
    default:
      return `{ ${serializeExpression(expr, level)} }`;
  }
}


function serializeExpression(expr, level = 0) {
  switch (expr.type) {
    case "StringLiteral":
      return serializeStringLiteral(expr);
    case "NumberLiteral":
      return serializeNumberLiteral(expr);
    case "MessageReference":
    case "TermReference":
      return serializeMessageReference(expr);
    case "VariableReference":
      return serializeVariableReference(expr);
    case "AttributeExpression":
      return serializeAttributeExpression(expr);
    case "VariantExpression":
      return serializeVariantExpression(expr);
    case "CallExpression":
      return serializeCallExpression(expr);
    case "SelectExpression":
      return serializeSelectExpression(expr, level);
    default:
      throw new Error(`Unknown expression type: ${expr.type}`);
  }
}


function serializeStringLiteral(expr) {
  return `"${expr.value}"`;
}


function serializeNumberLiteral(expr) {
  return expr.value;
}


function serializeMessageReference(expr) {
  return serializeIdentifier(expr.id);
}


function serializeVariableReference(expr) {
  return `$${serializeIdentifier(expr.id)}`;
}


function serializeSelectExpression(expr, level) {
  const parts = [];
  const selector = `${serializeExpression(expr.selector)} ->`;
  parts.push(selector);

  for (const variant of expr.variants) {
    parts.push(serializeVariant(variant, level + 1));
  }

  parts.push("\n");
  return parts.join("");
}


function serializeAttributeExpression(expr) {
  const ref = serializeExpression(expr.ref);
  const name = serializeIdentifier(expr.name);
  return `${ref}.${name}`;
}


function serializeVariantExpression(expr) {
  const ref = serializeExpression(expr.ref);
  const key = serializeVariantKey(expr.key);
  return `${ref}[${key}]`;
}


function serializeCallExpression(expr) {
  const fun = serializeFunction(expr.callee);
  const positional = expr.positional.map(serializeExpression).join(", ");
  const named = expr.named.map(serializeNamedArgument).join(", ");
  if (expr.positional.length > 0 && expr.named.length > 0) {
    return `${fun}(${positional}, ${named})`;
  } else if (expr.positional.length > 0) {
    return `${fun}(${positional})`;
  }
  return `${fun}(${named})`;
}


function serializeNamedArgument(arg) {
  const name = serializeIdentifier(arg.name);
  const value = serializeArgumentValue(arg.val);
  return `${name}: ${value}`;
}


function serializeArgumentValue(argval) {
  switch (argval.type) {
    case "StringLiteral":
      return serializeStringLiteral(argval);
    case "NumberLiteral":
      return serializeNumberLiteral(argval);
    default:
      throw new Error(`Unknown argument type: ${argval.type}`);
  }
}


function serializeIdentifier(identifier) {
  return identifier.name;
}


function serializeVariantName(VariantName) {
  return VariantName.name;
}


function serializeVariantKey(key) {
  switch (key.type) {
    case "VariantName":
      return serializeVariantName(key);
    case "NumberLiteral":
      return serializeNumberLiteral(key);
    default:
      throw new Error(`Unknown variant key type: ${key.type}`);
  }
}


function serializeFunction(fun) {
  return fun.name;
}
