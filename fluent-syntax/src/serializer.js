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

export
// Bit masks representing the state of the serializer.
const HAS_ENTRIES = 1;

export
class FluentSerializer {
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
    parts.push(serializePattern(message.value));
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
  parts.push(serializePattern(term.value));

  for (const attribute of term.attributes) {
    parts.push(serializeAttribute(attribute));
  }

  parts.push("\n");
  return parts.join("");
}


function serializeAttribute(attribute) {
  const value = indent(serializePattern(attribute.value));
  return `\n    .${attribute.id.name} =${value}`;
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
      return `{ ${serializeExpression(expr)}}`;
    default:
      return `{ ${serializeExpression(expr)} }`;
  }
}


export
function serializeExpression(expr) {
  switch (expr.type) {
    case "StringLiteral":
      return `"${expr.value}"`;
    case "NumberLiteral":
      return expr.value;
    case "VariableReference":
      return `$${expr.id.name}`;
    case "TermReference": {
      let out = `-${expr.id.name}`;
      if (expr.attribute) {
        out += `.${expr.attribute.name}`;
      }
      if (expr.arguments) {
        out += serializeCallArguments(expr.arguments);
      }
      return out;
    }
    case "MessageReference": {
      let out = expr.id.name;
      if (expr.attribute) {
        out += `.${expr.attribute.name}`;
      }
      return out;
    }
    case "FunctionReference":
      return `${expr.id.name}${serializeCallArguments(expr.arguments)}`;
    case "SelectExpression": {
      let out = `${serializeExpression(expr.selector)} ->`;
      for (let variant of expr.variants) {
        out += serializeVariant(variant);
      }
      return `${out}\n`;
    }
    case "Placeable":
      return serializePlaceable(expr);
    default:
      throw new Error(`Unknown expression type: ${expr.type}`);
  }
}


function serializeVariant(variant) {
  const key = serializeVariantKey(variant.key);
  const value = indent(serializePattern(variant.value));

  if (variant.default) {
    return `\n   *[${key}]${value}`;
  }

  return `\n    [${key}]${value}`;
}


function serializeCallArguments(expr) {
  const positional = expr.positional.map(serializeExpression).join(", ");
  const named = expr.named.map(serializeNamedArgument).join(", ");
  if (expr.positional.length > 0 && expr.named.length > 0) {
    return `(${positional}, ${named})`;
  }
  return `(${positional || named})`;
}


function serializeNamedArgument(arg) {
  const value = serializeExpression(arg.value);
  return `${arg.name.name}: ${value}`;
}


export
function serializeVariantKey(key) {
  switch (key.type) {
    case "Identifier":
      return key.name;
    case "NumberLiteral":
      return key.value;
    default:
      throw new Error(`Unknown variant key type: ${key.type}`);
  }
}
