'use strict';

/* jshint node:true */

var bundle = require('../../../build/babel/bundle');

module.exports = {
  jsshell: {
    options: bundle,
    files: {
      'dist/bundle/jsshell/l20n.js': 'src/runtime/jsshell/index.js'
    }
  },
};
