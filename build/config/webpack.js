'use strict';

// resolve relative to build/config
var path = require('path').resolve.bind(null, __dirname);

var babel = {
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
      'es6.classes',
      'es6.destructuring',
      'es6.arrowFunctions',
      'es6.properties.shorthand',
      'es6.forOf',
      'es6.spread',
      'es6.parameters.rest',
      'es6.parameters.default',
      'es6.blockScoping'
    ],
  }
};

module.exports = {
  web: {
    context: path('../../src'),
    entry: './runtime/web/index.js',
    output: {
      path: path('../dist'),
      filename: 'web/l20n.js',
      libraryTarget: 'this',

    },
    module: {
      loaders: [babel]
    }
  },
  gaia: {
    context: path('../../src'),
    entry: './runtime/web/index.js',
    output: {
      path: path('../dist'),
      filename: 'gaia/l20n.js',
      libraryTarget: 'this',

    },
    module: {
      loaders: [babel]
    }
  },
  gaiabuild: {
    context: path('../../src'),
    entry: './runtime/gaiabuild/index.js',
    output: {
      path: path('../dist'),
      filename: 'gaiabuild/l20n.js',
      libraryTarget: 'commonjs2',
    },
    module: {
      loaders: [babel]
    }
  },
  node: {
    context: path('../../src'),
    entry: './runtime/node/index.js',
    output: {
      path: path('../dist'),
      filename: 'node/l20n.js',
      libraryTarget: 'commonjs2',
    },
    externals: {
      'fs': true
    },
    module: {
      loaders: [babel]
    }
  },
};
