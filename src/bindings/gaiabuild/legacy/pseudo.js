'use strict';

// Recursively walk an AST node searching for content leaves
export function walkContent(node, fn) {
  if (typeof node === 'string') {
    return fn(node);
  }

  if (node.t === 'idOrVar') {
    return node;
  }

  const rv = Array.isArray(node) ? [] : {};
  const keys = Object.keys(node);

  for (let i = 0, key; (key = keys[i]); i++) {
    // don't change identifier ($i) nor indices ($x)
    if (key === '$i' || key === '$x') {
      rv[key] = node[key];
    } else {
      rv[key] = walkContent(node[key], fn);
    }
  }
  return rv;
}
