'use strict';

module.exports = {
  'jshint.main': {
    files: [
      'Gruntfile.js',
      'grunt/**/*.js',
      'test/**/*/js',
    ],
    tasks: ['jshint:mainFiltered'],
  },

  'jshint.src': {
    files: ['lib/**/*.js'],
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

  mochaTest: {
    files: [
      'lib/**/*.js',
      'tests/**/*.js',
    ],
    tasks: ['mochaTest:dot']
  }
};
