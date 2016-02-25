'use strict';

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var babel = require('babel-core');
var mkdirp = require('mkdirp');

var options = {
  loose: 'all',
  comments: false,
  optional: [
    'es6.spec.blockScoping',
    'runtime',
    'minification.deadCodeElimination',
    'minification.constantFolding',
    'minification.memberExpressionLiterals',
    'minification.propertyLiterals',
    'minification.removeDebugger',
    'validation.undeclaredVariableCheck',
  ],
  whitelist: [
    'strict',
    'es6.modules',
    'es6.classes',
    'es6.constants',
    'es6.destructuring',
    'es6.arrowFunctions',
    'es6.properties.shorthand',
    'es6.forOf',
    'es6.spread',
    'es6.parameters',
    'es6.blockScoping'
  ],
};

module.exports = function(grunt) {
  grunt.registerTask('compat', 'Transpile dist/bundle', function(entry) {
    var pattern = entry ?
      '../../dist/bundle/' + entry + '/**/*.js' :
      '../../dist/bundle/**/*.js';
    glob.sync(pattern, {
      cwd: __dirname
    }).forEach(function(foundpath) {
      var srcpath = path.relative('../../', foundpath);
      var filename = path.relative('dist/bundle', srcpath);
      var destpath = path.join('dist', 'compat', filename);

      mkdirp.sync(path.dirname(destpath));
      fs.writeFileSync(
        destpath,
        babel.transformFileSync(srcpath, options).code);
      grunt.log.writeln('>> '.green + destpath + ' transpiled.');
    });
  });
};
