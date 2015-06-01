'use strict';

// resolve relative to build/config
var path = require('path').resolve.bind(null, __dirname);

module.exports = {
  web: {
    context: path('../../src'),
    entry: {
      web: './runtime/web/index.js',
    },
    output: {
      path: path('../dist'),
      filename: '[name]/l20n.js',
      libraryTarget: 'this',

    },
    module: {
      loaders: [{ 
        test: /\.js$/,
        include: [
          path('../../src')
        ],
        loader: 'babel',
      }]
    }
  },
  gaia: {
    context: path('../../src'),
    entry: {
      gaia: './runtime/web/index.js',
    },
    output: {
      path: path('../dist'),
      filename: '[name]/l20n.js',
      libraryTarget: 'this',

    },
    module: {
      loaders: [{ 
        test: /\.js$/,
        include: [
          path('../../src')
        ],
        loader: 'babel',
        query: {
          comments: false,
          whitelist: [
            'strict',
            'es6.modules',
            'es6.destructuring',
            'es6.arrowFunctions',
            'es6.properties.shorthand',
            'es6.forOf',
            'es6.spread',
            'es6.parameters.rest',
            'es6.blockScoping'
          ],
        }
      }]
    }
  },
  node: {
    context: path('../../src'),
    entry: './bindings/node/index.js',
    output: {
      path: path('../dist'),
      filename: './node/l20n.js',
      libraryTarget: 'commonjs2',
    },
    externals: {
      'fs': true
    },
    module: {
      loaders: [{ 
        test: /\.js$/,
        include: [
          path('../../src')
        ],
        loader: 'babel'
      }]
    }
  },
};
