'use strict';

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var mkdirp = require('mkdirp');
var rollup = require('rollup');
var babel = require('rollup-plugin-babel');

var options = {
  comments: false,
  presets: [ 'es2015-rollup' ]
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

      rollup.rollup({
        entry: srcpath,
        plugins: [
          babel(options)
        ]
      }).then(function(bundle) {
        var result = bundle.generate({
          format: 'iife'
        });

        fs.writeFileSync(destpath, result.code);
        grunt.log.writeln('>> '.green + destpath + ' transpiled.');
      });
    });
  });
};
