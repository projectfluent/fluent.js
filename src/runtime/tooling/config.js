'use strict';

/* jshint node:true */

var bundle = require('../../../build/babel/bundle');

module.exports = {
  tooling: {
    options: bundle,
    files: {
      'dist/bundle/tooling/l20n.js': 'src/runtime/tooling/index.js'
    }
  },
  aisle: {
    options: bundle,
    files: {
      'dist/bundle/aisle/l20n.js': 'src/runtime/tooling/aisle.js'
    }
  },
  testing: {
    options: bundle,
    files: {
      'dist/bundle/testing/l20n.js': 'src/runtime/tooling/testing.js'
    }
  },
};
