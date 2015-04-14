'use strict';

var path = require('path').resolve.bind(null, __dirname);

module.exports = {
  context: path('../src'),
  entry: './bindings/node/index.js',
  output: {
    path: path('dist'),
    filename: './node/l10n3.js',
    libraryTarget: 'commonjs2',
  },
  externals: {
    'querystring': true,
    'fs': true
  },
  module: {
    loaders: [{ 
      test: /\.js$/,
      include: [
        path('../src')
      ],
      loader: 'babel-loader'
    }]
  }
};
