'use strict';

module.exports = {
  main: {
    src: [
      'Gruntfile.js',
      'build/**/*.js',
    ],
    options: {
      jshintrc: 'build/.jshintrc',
    },
  },
  src: {
    src: ['src/**/*.js'],
    options: {
      jshintrc: 'src/.jshintrc',
    },
  },
  tests: {
    src: ['tests/**/*.js'],
    options: {
      jshintrc: 'tests/.jshintrc',
    },
  },
};
