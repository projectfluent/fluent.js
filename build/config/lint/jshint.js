'use strict';

module.exports = {
  main: {
    src: [
      'Gruntfile.js',
      'grunt/**/*.js',
    ],
    options: {
      jshintrc: '.jshintrc',
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
