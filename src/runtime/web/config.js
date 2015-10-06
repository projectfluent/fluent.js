'use strict';

/* jshint node:true */

var bundle = require('../../../build/babel/bundle');

module.exports = {
  web: {
    options: bundle,
    files: {
      'dist/bundle/web/l20n.js': 'src/runtime/web/index.js'
    }
  },
  webcommon: {
    options: bundle,
    files: {
      'dist/bundle/web/l20n-common.js': 'src/runtime/web/api.js'
    }
  },
};
