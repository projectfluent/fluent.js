'use strict';

var bundler = require('./bundler');

module.exports = {
  web: {
    options: {
      plugins: bundler,
      whitelist: ''
    },
    files: {
      'dist/web/l20n.js': 'src/runtime/web/index.js'
    }
  },
  gaia: {
    options: {
      plugins: bundler,
      whitelist: ''
    },
    files: {
      'dist/gaia/l20n.js': 'src/runtime/gaia/index.js'
    }
  },
  jsshell: {
    options: {
      plugins: bundler,
      whitelist: ''
    },
    files: {
      'dist/jsshell/l20n.js': 'src/runtime/jsshell/index.js'
    }
  },
};
