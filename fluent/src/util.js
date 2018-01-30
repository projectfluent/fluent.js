function nonBlank(line) {
  return !/^\s*$/.test(line);
}

function countIndent(line) {
  const [indent] = line.match(/^\s*/);
  return indent.length;
}

/**
 * Template literal tag for dedenting FTL code.
 *
 * Strip the common indent of non-blank lines. Remove blank lines.
 *
 * @param {Array<string>} strings
 */
export function ftl(strings) {
  const [code] = strings;
  const lines = code.split('\n').filter(nonBlank);
  const indents = lines.map(countIndent);
  const common = Math.min(...indents);
  const indent = new RegExp(`^\\s{${common}}`);

  return lines.map(
    line => line.replace(indent, '')
  ).join('\n');
}
