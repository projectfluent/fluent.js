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
  }
};
