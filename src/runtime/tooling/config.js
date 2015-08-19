'use strict';

/* jshint node:true */

var config = require('../../../build/webpack/config');
var path = require('path').resolve.bind(null, __dirname);

module.exports = {
  tooling: {
    context: path('../../../src'),
    entry: './runtime/tooling/index.js',
    output: {
      path: path('../../../dist'),
      filename: 'tooling/l20n.js',
      library: 'L20n',
    },
    module: {
      loaders: [config.babel]
    }
  },
  aisle: {
    context: path('../../../src'),
    entry: './runtime/tooling/aisle.js',
    output: {
      path: path('../../../dist'),
      filename: 'aisle/l20n.js',
      libraryTarget: 'amd',

    },
    module: {
      loaders: [config.babel]
    }
  },
};
