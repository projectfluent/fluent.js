'use strict';

export function ftl(strings) {
  const [code] = strings;
  return code.replace(/^\s*/mg, '');
}
