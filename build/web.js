'use strict';

var path = require('path').resolve.bind(null, __dirname);

module.exports = {
  context: path('../src'),
  entry: {
    web: './runtime/web/index.js',
  },
  output: {
    path: path('dist'),
    filename: '[name]/l10n3.js',
    libraryTarget: 'this',

  },
  externals: {
    'unescape': true
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
