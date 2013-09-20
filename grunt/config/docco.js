'use strict';

module.exports = {
  lib: {
    options: {
      output: 'dist/docs/lib/',
    },
    src: [
      'lib/*.js',
      'lib/l20n/*.js',
      'lib/l20n/platform/*.js',
    ],
  },
  'lib-client': {
    options: {
      output: 'dist/docs/lib/client/',
    },
    src: ['lib/client/l20n/platform/*.js'],
  },
  bindings: {
    options: {
      output: 'dist/docs/bindings/',
    },
    src: ['bindings/l20n/*.js'],
  },
};
