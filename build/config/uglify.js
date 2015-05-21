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
      'build/dist/web/l20n.min.js': ['build/dist/web/l20n.js'],
    }
  },
};
