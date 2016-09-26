'use strict';

// Unicode bidi isolation characters
export const FSI = '\u2068';
export const PDI = '\u2069';

// > isolate('Hello, [world].')
// 'Hello, \u2068world\u2069.'
export function isolate(str) {
  return str.replace('[', FSI).replace(']', PDI);
}

export function ftl(strings) {
  const [code] = strings;
  return code.replace(/^\s*/mg, '');
}
