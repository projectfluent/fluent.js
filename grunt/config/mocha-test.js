'use strict';

var src = [
  'tests/lib/env/*_test.js',
  'tests/lib/context/lifecycle_test.js',
  'tests/lib/context/resources_test.js',
  'tests/lib/context/fallback_test.js',
  'tests/lib/parser/*_test.js',
  'tests/lib/compiler/*_test.js',
  'tests/lib/*_test.js',
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
