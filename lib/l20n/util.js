'use strict';


/* Utility functions */

// Recursively walk an AST node searching for content leaves
function walkContent(node, fn) {
  if (typeof node === 'string') {
    return fn(node);
  }

  var rv = {};
  for (var key in node) {
    if (key !== '_index' && (key in node)) {
      rv[key] = walkContent(node[key], fn);
    }
  }
  return rv;
}

exports.walkContent = walkContent;
