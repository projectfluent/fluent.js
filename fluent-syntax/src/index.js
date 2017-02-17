export * from './ast';
export * from './parser';

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
