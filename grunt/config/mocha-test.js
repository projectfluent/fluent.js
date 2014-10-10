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
  },

  coverage: {
    options: {
      reporter: 'html-cov',
      // Suppress the mocha console output
      quiet: true,
      // A destination file to capture the mocha
      // output (the quiet option does not suppress this).
      captureFile: 'dist/docs/coverage.html',
    },
    src: src,
  },
};
