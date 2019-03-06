import { includes } from "./util";

function indent(content) {
  return content.split("\n").join("\n    ");
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
        return serializeMessage(entry);
      case "Term":
        return serializeTerm(entry);
      case "Comment":
        if (state & HAS_ENTRIES) {
          return `\n${serializeComment(entry, "#")}\n`;
        }
        return `${serializeComment(entry, "#")}\n`;
      case "GroupComment":
        if (state & HAS_ENTRIES) {
          return `\n${serializeComment(entry, "##")}\n`;
        }
        return `${serializeComment(entry, "##")}\n`;
      case "ResourceComment":
        if (state & HAS_ENTRIES) {
          return `\n${serializeComment(entry, "###")}\n`;
        }
        return `${serializeComment(entry, "###")}\n`;
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


function serializeComment(comment, prefix = "#") {
  const prefixed = comment.content.split("\n").map(
    line => line.length ? `${prefix} ${line}` : prefix
  ).join("\n");
  // Add the trailing newline.
  return `${prefixed}\n`;
}


function serializeJunk(junk) {
  return junk.content;
}


function serializeMessage(message) {
  const parts = [];

  if (message.comment) {
    parts.push(serializeComment(message.comment));
  }

  parts.push(`${message.id.name} =`);

  if (message.value) {
    parts.push(serializeValue(message.value));
  }

  for (const attribute of message.attributes) {
    parts.push(serializeAttribute(attribute));
  }

  parts.push("\n");
  return parts.join("");
}


function serializeTerm(term) {
  const parts = [];

  if (term.comment) {
    parts.push(serializeComment(term.comment));
  }

  parts.push(`-${term.id.name} =`);
  parts.push(serializeValue(term.value));

  for (const attribute of term.attributes) {
    parts.push(serializeAttribute(attribute));
  }

  parts.push("\n");
  return parts.join("");
}


function serializeAttribute(attribute) {
  const value = indent(serializeValue(attribute.value));
  return `\n    .${attribute.id.name} =${value}`;
}


function serializeValue(value) {
  switch (value.type) {
    case "Pattern":
      return serializePattern(value);
    case "VariantList":
      return serializeVariantList(value);
    default:
      throw new Error(`Unknown value type: ${value.type}`);
  }
}


function serializePattern(pattern) {
  const content = pattern.elements.map(serializeElement).join("");
  const startOnNewLine =
    pattern.elements.some(isSelectExpr) ||
    pattern.elements.some(includesNewLine);

  if (startOnNewLine) {
    return `\n    ${indent(content)}`;
  }

  return ` ${content}`;
}


function serializeVariantList(varlist) {
  const content = varlist.variants.map(serializeVariant).join("");
  return `\n    {${indent(content)}\n    }`;
}


function serializeVariant(variant) {
  const key = serializeVariantKey(variant.key);
  const value = indent(serializeValue(variant.value));

  if (variant.default) {
    return `\n   *[${key}]${value}`;
  }

  return `\n    [${key}]${value}`;
}


function serializeElement(element) {
  switch (element.type) {
    case "TextElement":
      return element.value;
    case "Placeable":
      return serializePlaceable(element);
    default:
      throw new Error(`Unknown element type: ${element.type}`);
  }
}


function serializePlaceable(placeable) {
  const expr = placeable.expression;

  switch (expr.type) {
    case "Placeable":
      return `{${serializePlaceable(expr)}}`;
    case "SelectExpression":
      // Special-case select expression to control the whitespace around the
      // opening and the closing brace.
      return `{ ${serializeSelectExpression(expr)}}`;
    default:
      return `{ ${serializeExpression(expr)} }`;
  }
}


function serializeExpression(expr) {
  switch (expr.type) {
    case "StringLiteral":
      return `"${expr.raw}"`;
    case "NumberLiteral":
      return expr.value;
    case "MessageReference":
    case "FunctionReference":
      return expr.id.name;
    case "TermReference":
      return `-${expr.id.name}`;
    case "VariableReference":
      return `$${expr.id.name}`;
    case "AttributeExpression":
      return serializeAttributeExpression(expr);
    case "VariantExpression":
      return serializeVariantExpression(expr);
    case "CallExpression":
      return serializeCallExpression(expr);
    case "SelectExpression":
      return serializeSelectExpression(expr);
    case "Placeable":
      return serializePlaceable(expr);
    default:
      throw new Error(`Unknown expression type: ${expr.type}`);
  }
}


function serializeSelectExpression(expr) {
  const parts = [];
  const selector = `${serializeExpression(expr.selector)} ->`;
  parts.push(selector);

  for (const variant of expr.variants) {
    parts.push(serializeVariant(variant));
  }

  parts.push("\n");
  return parts.join("");
}


function serializeAttributeExpression(expr) {
  const ref = serializeExpression(expr.ref);
  return `${ref}.${expr.name.name}`;
}


function serializeVariantExpression(expr) {
  const ref = serializeExpression(expr.ref);
  const key = serializeVariantKey(expr.key);
  return `${ref}[${key}]`;
}


function serializeCallExpression(expr) {
  const callee = serializeExpression(expr.callee);
  const positional = expr.positional.map(serializeExpression).join(", ");
  const named = expr.named.map(serializeNamedArgument).join(", ");
  if (expr.positional.length > 0 && expr.named.length > 0) {
    return `${callee}(${positional}, ${named})`;
  }
  return `${callee}(${positional || named})`;
}


function serializeNamedArgument(arg) {
  const value = serializeExpression(arg.value);
  return `${arg.name.name}: ${value}`;
}


function serializeVariantKey(key) {
  switch (key.type) {
    case "Identifier":
      return key.name;
    default:
      return serializeExpression(key);
  }
}
