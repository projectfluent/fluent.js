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
  web: {
    files: {
      'dist/webcompat/l20n.min.js': ['dist/webcompat/l20n.js'],
    }
  },
};
