'use strict';


/* Utility functions */

// Recursively walk an AST node searching for content leaves
function walkContent(node, fn) {
  if (typeof node === 'string') {
    return fn(node);
  }

  if (node.t === 'idOrVar') {
    return node;
  }

  var rv = Array.isArray(node) ? [] : {};
  var keys = Object.keys(node);

  for (var i = 0, key; (key = keys[i]); i++) {
    // don't change identifier ($i) nor indices ($x)
    if (key === '$i' || key === '$x') {
      rv[key] = node[key];
    } else {
      rv[key] = walkContent(node[key], fn);
    }
  }
  return rv;
}

exports.walkContent = walkContent;
