'use strict';

// Unicode bidi isolation characters
export const FSI = '\u2068';
export const PDI = '\u2069';

// > bdi`Hello, [world].`
// 'Hello, \u2068world\u2069.'
export function bdi(strings) {
  const [str] = strings;
  return str.replace(/\[/g, FSI).replace(/\]/g, PDI);
}

export function ftl(strings) {
  const [code] = strings;
  return code.replace(/^\s*/mg, '');
}
