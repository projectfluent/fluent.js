'use strict';

function nonBlank(line) {
  return !/^\s*$/.test(line);
}

function countIndent(line) {
  const [indent] = line.match(/^\s*/);
  return indent.length;
}

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
