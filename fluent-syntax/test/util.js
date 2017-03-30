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
  const lines = code.split('\n').slice(1, -1);
  const indents = lines.filter(nonBlank).map(countIndent);
  const common = Math.min(...indents);
  const indent = new RegExp(`^\\s{${common}}`);
  const dedented = lines.map(line => line.replace(indent, ''));
  return `${dedented.join('\n')}\n`;
}
