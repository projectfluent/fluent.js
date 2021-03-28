import { Resource } from "./ast.js";
import { FluentParser, FluentParserOptions } from "./parser.js";
import { FluentSerializer, FluentSerializerOptions } from "./serializer.js";

export * from "./ast";
export * from "./errors";
export * from "./parser";
export * from "./serializer";
export * from "./visitor";

export function parse(source: string, opts: FluentParserOptions): Resource {
  const parser = new FluentParser(opts);
  return parser.parse(source);
}

export function serialize(
  resource: Resource,
  opts: FluentSerializerOptions
): string {
  const serializer = new FluentSerializer(opts);
  return serializer.serialize(resource);
}

export function lineOffset(source: string, pos: number): number {
  // Subtract 1 to get the offset.
  return source.substring(0, pos).split("\n").length - 1;
}

export function columnOffset(source: string, pos: number): number {
  // Find the last line break starting backwards from the index just before
  // pos.  This allows us to correctly handle ths case where the character at
  // pos  is a line break as well.
  const fromIndex = pos - 1;
  const prevLineBreak = source.lastIndexOf("\n", fromIndex);

  // pos is a position in the first line of source.
  if (prevLineBreak === -1) {
    return pos;
  }

  // Subtracting two offsets gives length; subtract 1 to get the offset.
  return pos - prevLineBreak - 1;
}
