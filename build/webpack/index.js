'use strict';

var glob = require('glob');

glob.sync('../../src/runtime/**/config.js', {
  cwd: __dirname
}).forEach(function(file) {
  var tasks = require(file);
  for (var name in tasks) {
    module.exports[name] = tasks[name];
  }
});
