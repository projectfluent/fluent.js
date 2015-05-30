'use strict';

require('babel/register');

var src = [
  'tests/lib/*.js',
  'tests/lib/parser/properties/*.js',
  'tests/lib/parser/l20n/*.js',
  'tests/lib/resolver/*.js',
  'tests/lib/context/*.js',
  'tests/lib/env/*.js',
];

module.exports = {
  dot: {
    options: {
      reporter: 'dot',
    },
    src: src,
  }
};
