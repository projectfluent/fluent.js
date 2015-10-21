'use strict';

/* jshint node:true */

module.exports = {
  tooling: {
    files: {
      'dist/bundle/tooling/l20n.js': 'src/runtime/tooling/index.js'
    }
  },
  aisle: {
    options: {
      format: 'amd'
    },
    files: {
      'dist/bundle/aisle/l20n.js': 'src/runtime/tooling/aisle.js'
    }
  },
  testing: {
    files: {
      'dist/bundle/testing/l20n.js': 'src/runtime/tooling/testing.js'
    }
  },
};
