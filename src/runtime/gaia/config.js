'use strict';

/* jshint node:true */

module.exports = {
  gaia: {
    files: {
      'dist/bundle/gaia/l20n.js': 'src/runtime/gaia/index.js',
    }
  },
  gaiabuild: {
    options: {
      format: 'cjs',
    },
    files: {
      'dist/bundle/gaia/build/l20n.js': 'src/runtime/gaia/build/index.js'
    }
  },
};
