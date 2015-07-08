'use strict';

var bundler = require('./bundler');

module.exports = {
  gaia: {
    options: {
      plugins: bundler,
      whitelist: ''
    },
    files: {
      'build/dist/gaia/l20n.js': 'src/runtime/web/index.js'
    }
  },
  jsshell: {
    options: {
      plugins: bundler,
      whitelist: ''
    },
    files: {
      'build/dist/jsshell/l20n.js': 'src/runtime/jsshell/index.js'
    }
  },
};
