'use strict';

export function createEntry(node) {
  const keys = Object.keys(node);

  // the most common scenario: a simple string with no arguments
  if (typeof node.$v === 'string' && keys.length === 2) {
    return node.$v;
  }

  let attrs;

  for (let i = 0, key; (key = keys[i]); i++) {
    // skip $i (id), $v (value), $x (index)
    if (key[0] === '$') {
      continue;
    }

    if (!attrs) {
      attrs = Object.create(null);
    }
    attrs[key] = createAttribute(node[key]);
  }

  return {
    value: node.$v !== undefined ? node.$v : null,
    index: node.$x || null,
    attrs: attrs || null,
  };
}

function createAttribute(node) {
  if (typeof node === 'string') {
    return node;
  }

  return {
    value: node.$v || (node !== undefined ? node : null),
    index: node.$x || null,
  };
}
