'use strict';

module.exports = {
  main: {
    src: [
      'Gruntfile.js',
      'build/config/**/*.js',
    ],
    options: {
      jshintrc: 'build/config/.jshintrc',
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
