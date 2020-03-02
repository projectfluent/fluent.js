import * as AST from "./ast.js";

function indent(content: string): string {
  return content.split("\n").join("\n    ");
}

function includesNewLine(elem: AST.PatternElement): boolean {
  return elem instanceof AST.TextElement && elem.value.includes("\n");
}

function isSelectExpr(elem: AST.PatternElement): boolean {
  return elem instanceof AST.Placeable
    && elem.expression instanceof AST.SelectExpression;
}

// Bit masks representing the state of the serializer.
export const HAS_ENTRIES = 1;

export interface FluentSerializerOptions {
  withJunk?: boolean;
}

export class FluentSerializer {
  public withJunk: boolean;

  constructor({ withJunk = false }: FluentSerializerOptions = {}) {
    this.withJunk = withJunk;
  }

  serialize(resource: AST.Resource): string {
    if (!(resource instanceof AST.Resource)) {
      throw new Error(`Unknown resource type: ${resource}`);
    }

    let state = 0;
    const parts = [];

    for (const entry of resource.body) {
      if (!(entry instanceof AST.Junk) || this.withJunk) {
        parts.push(this.serializeEntry(entry, state));
        if (!(state & HAS_ENTRIES)) {
          state |= HAS_ENTRIES;
        }
      }
    }

    return parts.join("");
  }

  serializeEntry(entry: AST.Entry | AST.Junk, state: number = 0): string {
    if (entry instanceof AST.Message) {
      return serializeMessage(entry);
    }
    if (entry instanceof AST.Term) {
      return serializeTerm(entry);
    }
    if (entry instanceof AST.Comment) {
      if (state & HAS_ENTRIES) {
        return `\n${serializeComment(entry, "#")}\n`;
      }
      return `${serializeComment(entry, "#")}\n`;
    }
    if (entry instanceof AST.GroupComment) {
      if (state & HAS_ENTRIES) {
        return `\n${serializeComment(entry, "##")}\n`;
      }
      return `${serializeComment(entry, "##")}\n`;
    }
    if (entry instanceof AST.ResourceComment) {
      if (state & HAS_ENTRIES) {
        return `\n${serializeComment(entry, "###")}\n`;
      }
      return `${serializeComment(entry, "###")}\n`;
    }
    if (entry instanceof AST.Junk) {
      return serializeJunk(entry);
    }
    throw new Error(`Unknown entry type: ${entry}`);
  }
}


function serializeComment(comment: AST.BaseComment, prefix = "#"): string {
  const prefixed = comment.content.split("\n").map(
    line => line.length ? `${prefix} ${line}` : prefix
  ).join("\n");
  // Add the trailing newline.
  return `${prefixed}\n`;
}


function serializeJunk(junk: AST.Junk): string {
  return junk.content;
}


function serializeMessage(message: AST.Message): string {
  const parts: Array<string> = [];

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


function serializeTerm(term: AST.Term): string {
  const parts: Array<string> = [];

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


function serializeAttribute(attribute: AST.Attribute): string {
  const value = indent(serializePattern(attribute.value));
  return `\n    .${attribute.id.name} =${value}`;
}


function serializePattern(pattern: AST.Pattern): string {
  const content = pattern.elements.map(serializeElement).join("");
  const startOnNewLine =
    pattern.elements.some(isSelectExpr) ||
    pattern.elements.some(includesNewLine);

  if (startOnNewLine) {
    return `\n    ${indent(content)}`;
  }

  return ` ${content}`;
}


function serializeElement(element: AST.PatternElement): string {
  if (element instanceof AST.TextElement) {
    return element.value;
  }

  if (element instanceof AST.Placeable) {
    return serializePlaceable(element);
  }

  throw new Error(`Unknown element type: ${element}`);
}


function serializePlaceable(placeable: AST.Placeable): string {
  const expr = placeable.expression;
  if (expr instanceof AST.Placeable) {
    return `{${serializePlaceable(expr)}}`;
  }
  if (expr instanceof AST.SelectExpression) {
    // Special-case select expression to control the whitespace around the
    // opening and the closing brace.
    return `{ ${serializeExpression(expr)}}`;
  }
  return `{ ${serializeExpression(expr)} }`;
}


export function serializeExpression(expr: AST.Expression): string {
  if (expr instanceof AST.StringLiteral) {
    return `"${expr.value}"`;
  }
  if (expr instanceof AST.NumberLiteral) {
    return expr.value;
  }
  if (expr instanceof AST.VariableReference) {
    return `$${expr.id.name}`;
  }
  if (expr instanceof AST.TermReference) {
    let out = `-${expr.id.name}`;
    if (expr.attribute) {
      out += `.${expr.attribute.name}`;
    }
    if (expr.arguments) {
      out += serializeCallArguments(expr.arguments);
    }
    return out;
  }
  if (expr instanceof AST.MessageReference) {
    let out = expr.id.name;
    if (expr.attribute) {
      out += `.${expr.attribute.name}`;
    }
    return out;
  }
  if (expr instanceof AST.FunctionReference) {
    return `${expr.id.name}${serializeCallArguments(expr.arguments)}`;
  }
  if (expr instanceof AST.SelectExpression) {
    let out = `${serializeExpression(expr.selector)} ->`;
    for (let variant of expr.variants) {
      out += serializeVariant(variant);
    }
    return `${out}\n`;
  }
  if (expr instanceof AST.Placeable) {
    return serializePlaceable(expr);
  }
  throw new Error(`Unknown expression type: ${expr}`);
}


function serializeVariant(variant: AST.Variant): string {
  const key = serializeVariantKey(variant.key);
  const value = indent(serializePattern(variant.value));

  if (variant.default) {
    return `\n   *[${key}]${value}`;
  }

  return `\n    [${key}]${value}`;
}


function serializeCallArguments(expr: AST.CallArguments): string {
  const positional = expr.positional.map(serializeExpression).join(", ");
  const named = expr.named.map(serializeNamedArgument).join(", ");
  if (expr.positional.length > 0 && expr.named.length > 0) {
    return `(${positional}, ${named})`;
  }
  return `(${positional || named})`;
}


function serializeNamedArgument(arg: AST.NamedArgument): string {
  const value = serializeExpression(arg.value);
  return `${arg.name.name}: ${value}`;
}

export function serializeVariantKey(
  key: AST.Identifier | AST.NumberLiteral
): string {
  if (key instanceof AST.Identifier) {
    return key.name;
  }
  if (key instanceof AST.NumberLiteral) {
    return key.value;
  }
  throw new Error(`Unknown variant key type: ${key}`);
}
