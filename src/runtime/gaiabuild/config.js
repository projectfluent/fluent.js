'use strict';

/* jshint node:true */

var config = require('../../../build/webpack/config');
var path = require('path').resolve.bind(null, __dirname);

module.exports = {
  gaiabuild: {
    context: path('../../../src'),
    entry: './runtime/gaiabuild/index.js',
    output: {
      path: path('../../../dist'),
      filename: 'gaiabuild/l20n.js',
      libraryTarget: 'commonjs2',
    },
    module: {
      loaders: [config.babel]
    }
  },
};
