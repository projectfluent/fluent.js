'use strict';

module.exports = {
  'jshint.main': {
    files: [
      'Gruntfile.js',
      'grunt/**/*.js',
      'test/**/*.js',
    ],
    tasks: ['jshint:mainFiltered'],
  },

  'jshint.lib': {
    files: [
      'src/lib/**/*.js',
    ],
    tasks: ['jshint:libFiltered', 'concat'],
  },

  'jshint.html': {
    files: [
      'src/bindings/**/*.js',
    ],
    tasks: ['jshint:htmlFiltered', 'concat'],
  },

  jsonlint: {
    files: [
      'package.json',
      '.jshintrc',
      '{lib,examples,tests}/**/*.json',
    ],
    tasks: ['jsonlint:allFiltered'],
  },
};
