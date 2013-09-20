'use strict';

module.exports = {
  options: {
    compress: {
      screw_ie8: true,
    },
    mangle: {
      screw_ie8: true,
    },
  },
  html: {
    files: {
      'dist/html/l20n.min.js': ['dist/html/l20n.js'],
    }
  },
  gaia: {
    files: {
      'dist/gaia/l20n.min.js': ['dist/gaia/l20n.js'],
    }
  },
};
