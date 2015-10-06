'use strict';

/* jshint node:true */

var bundle = require('../../../build/babel/bundle');

module.exports = {
  gaia: {
    options: bundle,
    files: {
      'dist/bundle/gaia/l20n.js': 'src/runtime/gaia/index.js',
      'dist/bundle/gaia/build/l20n.js': 'src/runtime/gaia/build/index.js'
    }
  },
};
