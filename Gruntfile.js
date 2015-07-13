'use strict';

var fs = require('fs');

module.exports = function (grunt) {
  // These are pairs [task, target] for which a copied tasks with an
  // additional filter option are created. Those tasks are then passed to the
  // watch task to be fired on file changes; the filter option makes sure
  // tasks are fired only on changed files, making them a lot faster.
  // Unfortunately, we can't just apply a filter to the basic configuration as
  // no files would be processed during initial runs.
  var filteredTasks = [
    ['jshint', 'main'],
    ['jshint', 'src'],
    ['jshint', 'tests'],
    ['jsonlint', 'all'],
  ];

  function filterNewFiles(src) {
    // Returns a function that tells if a file was recently modified;
    // it's used by jshint & defs tasks so that they run only on changed
    // files.
    var srcTime = fs.statSync(src).mtime.getTime();
    // Don't watch files changed before last 10 seconds.
    return srcTime > Date.now() - 10000;
  }

  // Load all grunt tasks matching the `grunt-*` pattern.
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    webpack: require('./build/webpack'),
    babel: require('./build/babel'),
    copy: require('./build/copy'),
    clean: require('./build/clean'),
    jshint: require('./build/lint/jshint'),
    jsonlint: require('./build/lint/jsonlint'),
    'merge-conflict': require('./build/lint/merge-conflict'),
    mochaTest: require('./build/mocha-test'),
    shell: require('./build/shell'),
    uglify: require('./build/uglify'),
    watch: require('./build/watch'),
  });

  // Add copies of watched tasks with an added filter option.
  filteredTasks.forEach(function (taskAndTarget) {
    var newTaskAndTarget = taskAndTarget.slice(0);
    newTaskAndTarget[newTaskAndTarget.length - 1] =
      newTaskAndTarget[newTaskAndTarget.length - 1] + 'Filtered';

    grunt.config(newTaskAndTarget, grunt.config(taskAndTarget));
    grunt.config(newTaskAndTarget.concat(['filter']), filterNewFiles);
  });

  grunt.registerTask('reference', ['shell:reference']);
  grunt.registerTask('perf', ['shell:perf']);

  grunt.registerTask('lint', [
    'jshint:main',
    'jshint:src',
    'jshint:tests',
    'jsonlint:all',
  ]);

  grunt.registerTask('test', [
    'mochaTest:dot'
  ]);

  grunt.registerTask('build', [
    'lint',
    'test',
    'webpack:webcompat',
    'babel:web',
  ]);

  grunt.registerTask('gaia', [
    'lint',
    'test',
    'webpack:gaiabuild',
    'babel:web',
    'copy:stage'
  ]);

  grunt.registerTask('release', [
    'lint',
    'test',
    'webpack',
    'babel',
    'uglify'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);
};
