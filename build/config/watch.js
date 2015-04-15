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

  'jshint.src': {
    files: [
      'src/**/*.js',
    ],
    tasks: ['jshint:srcFiltered'],
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
