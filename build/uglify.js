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
      'dist/compat/web/l20n.min.js': ['dist/compat/web/l20n.js'],
    }
  },
};
