'use strict';

var insecure = require('../var/insecure');

var src = [
  'tests/lib/*.js',
  'tests/lib/context/*.js',
  'tests/lib/compiler/*.js',
  'tests/integration/*.js',
].concat(insecure ? ['tests/lib/compiler/insecure/*.js'] : []);

module.exports = {
  dot: {
    options: {
      reporter: 'dot',
      require: 'should',
    },
    src: src,
  },

  coverage: {
    options: {
      reporter: 'html-cov',
      require: 'should',
      // Suppress the mocha console output
      quiet: true,
      // A destination file to capture the mocha
      // output (the quiet option does not suppress this).
      captureFile: 'dist/docs/coverage.html',
    },
    src: src,
  },
};
