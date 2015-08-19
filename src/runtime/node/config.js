'use strict';

/* jshint node:true */

var config = require('../../../build/webpack/config');
var path = require('path').resolve.bind(null, __dirname);

module.exports = {
  node: {
    context: path('../../../src'),
    entry: './runtime/node/index.js',
    output: {
      path: path('../../../dist'),
      filename: 'node/l20n.js',
      libraryTarget: 'commonjs2',
    },
    externals: ['fs'],
    module: {
      loaders: [config.babel]
    }
  }
};
