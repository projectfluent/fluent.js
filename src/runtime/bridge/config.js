'use strict';

/* jshint node:true */

var bundle = require('../../../build/babel/bundle');

module.exports = {
  bridge: {
    options: bundle,
    files: {
      'dist/bundle/bridge/service.js': 'src/runtime/bridge/service.js',
      'dist/bundle/bridge/client.js': 'src/runtime/bridge/client.js'
    }
  },
};
