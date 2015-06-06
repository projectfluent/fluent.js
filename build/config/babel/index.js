'use strict';

var bundler = require('./bundler');

module.exports = {
  gaia: {
    options: {
      plugins: bundler,
      whitelist: 'es7.trailingFunctionCommas'
    },
    files: {
      'build/dist/gaia/l20n.js': 'src/runtime/web/index.js'
    }
  },
  gaiabuild: {
    options: {
      plugins: bundler,
      whitelist: 'es7.trailingFunctionCommas'
    },
    files: {
      'build/dist/gaiabuild/l20n.js': 'src/runtime/gaiabuild/index.js'
    }
  },
  jsshell: {
    options: {
      plugins: bundler,
      whitelist: 'es7.trailingFunctionCommas'
    },
    files: {
      'build/dist/jsshell/l20n.js': 'src/runtime/jsshell/index.js'
    }
  },
};
