'use strict';

var src = [
  'tests/lib/*.js',
  'tests/lib/parser/*.js',
  'tests/lib/resolver/*.js',
  'tests/lib/context/*.js',
];

module.exports = {
  dot: {
    options: {
      reporter: 'dot',
    },
    src: src,
  }
};
