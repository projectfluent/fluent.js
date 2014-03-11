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

  'jshint.lib': {
    files: [
      'lib/**/*.js',
    ],
    tasks: ['jshint:libFiltered', 'concat'],
  },

  'jshint.bindings': {
    files: [
      'bindings/**/*.js',
    ],
    tasks: ['jshint:bindingsFiltered', 'concat'],
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
