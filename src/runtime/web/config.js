'use strict';

/* jshint node:true */

var config = require('../../../build/webpack/config');
var path = require('path').resolve.bind(null, __dirname);

module.exports = {
  webcompat: {
    context: path('../../../src'),
    entry: './runtime/web/index.js',
    output: {
      path: path('../../../dist'),
      filename: 'webcompat/l20n.js',
      libraryTarget: 'this',
    },
    module: {
      loaders: [config.babel]
    }
  },
  webcommon: {
    context: path('../../../src'),
    entry: './runtime/web/api.js',
    output: {
      path: path('../../../dist'),
      filename: 'web/l20n-common.js',
      libraryTarget: 'commonjs2',
    },
    module: {
      loaders: [config.babel]
    }
  }
};
