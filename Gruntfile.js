'use strict';

module.exports = function (grunt) {
  var fs = require('fs'),
  // These are pairs [task, target] for which a copied tasks with an additional
  // filter option are created. Those tasks are then passed to the watch task
  // to be fired on file changes; the filter option makes sure tasks are fired
  // only on changed files, making them a lot faster. Unfortunately, we can't
  // just apply a filter to the basic configuration as no files would be
  // processed during initial runs.
    filteredTasks = [
      ['jshint', 'main'],
      ['jshint', 'src'],
      ['jshint', 'tests'],
      ['jsonlint', 'all'],
    ];


  function filterNewFiles(src) {
    // Returns a function that tells if a file was recently modified;
    // it's used by jshint & defs tasks so that they run only on changed files.
    var srcTime = fs.statSync(src).mtime.getTime();
    // Don't watch files changed before last 10 seconds.
    return srcTime > Date.now() - 10000;
  }

  grunt.initConfig({
    compile: require('./grunt/config/compile'),
    clean: require('./grunt/config/clean'),
    copy: require('./grunt/config/copy'),
    docco: require('./grunt/config/docco'),
    jshint: require('./grunt/config/lint/jshint'),
    jscoverage: require('./grunt/config/jscoverage'),
    jsonlint: require('./grunt/config/lint/jsonlint'),
    'merge-conflict': require('./grunt/config/lint/merge-conflict'),
    mochaTest: require('./grunt/config/mocha-test'),
    shell: require('./grunt/config/shell'),
    uglify: require('./grunt/config/uglify'),
    watch: require('./grunt/config/watch'),
  });


  // Add copies of watched tasks with an added filter option.
  filteredTasks.forEach(function (taskAndTarget) {
    var newTaskAndTarget = taskAndTarget.slice(0);
    newTaskAndTarget[newTaskAndTarget.length - 1] =
      newTaskAndTarget[newTaskAndTarget.length - 1] + 'Filtered';

    grunt.config(newTaskAndTarget, grunt.config(taskAndTarget));
    grunt.config(newTaskAndTarget.concat(['filter']), filterNewFiles);
  });

  // Load all grunt tasks matching the `grunt-*` pattern.
  require('load-grunt-tasks')(grunt);

  // Load all custom tasks.
  grunt.loadTasks('grunt/tasks');


  grunt.registerTask('install-git-hook', 'copy:install-git-hook');

  grunt.registerTask('server', [
    'build',
    'watch',
  ]);

  grunt.registerTask('lint', [
    'jshint:main',
    'jshint:src',
    'jshint:tests',
    'jsonlint:all',
  ]);

  grunt.registerTask('build', [
    'clean',
    'compile:html',
    'uglify:html',
  ]);

  grunt.registerTask('gh-pages', [
    'docco',
    'shell:gh-pages',
  ]);

  grunt.registerTask('reference', ['shell:reference']);
  grunt.registerTask('perf', ['shell:perf']);

  grunt.registerTask('test', ['mochaTest:dot']);

  // TODO first make sure `dist/docs` exists.
  grunt.registerTask('coverage', function () {
    process.env.L20N_COV = 1;
    grunt.file.mkdir('dist/docs');
    grunt.task.run([
      'jscoverage',
      'mochaTest:coverage',
    ]);
  });

  grunt.registerTask('default', [
    'merge-conflict',
    'lint',
    'build',
    'test',
  ]);
};
