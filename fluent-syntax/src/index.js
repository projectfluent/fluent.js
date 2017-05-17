import FluentParser from './parser';
import FluentSerializer from './serializer';

export * from './ast';
export { FluentParser, FluentSerializer };

export function parse(source, opts) {
  const parser = new FluentParser(opts);
  return parser.parse(source);
}

export function serialize(resource, opts) {
  const serializer = new FluentSerializer(opts);
  return serializer.serialize(resource);
}

export function lineOffset(source, pos) {
  // Substract 1 to get the offset.
  return source.substring(0, pos).split('\n').length - 1;
}

export function columnOffset(source, pos) {
  const lastLineBreak = source.lastIndexOf('\n', pos);
  return lastLineBreak === -1
    ? pos
    // Substracting two offsets gives length; substract 1 to get the offset.
    : pos - lastLineBreak - 1;
}
