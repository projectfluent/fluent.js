'use strict';

/* jshint node:true */

module.exports = {
  web: {
    files: {
      'dist/bundle/web/l20n.js': 'src/runtime/web/index.js'
    }
  },
  webcommon: {
    options: {
      format: 'cjs',
    },
    files: {
      'dist/bundle/web/l20n-common.js': 'src/runtime/web/api.js'
    }
  },
};
