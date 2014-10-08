'use strict';


/* Utility functions */

// Recursively walk an AST node searching for content leaves
function walkContent(node, fn) {
  if (!node || typeof node === 'string') {
    return fn(node);
  }

  var rv = {};
  var keys = Object.keys(node);

  /* jshint boss:true */
  for (var i = 0, key; key = keys[i]; i++) {
    if (key === '_index') {
      rv[key] = node[key];
    } else {
      rv[key] = walkContent(node[key], fn);
    }
  }
  return rv;
}

exports.walkContent = walkContent;
