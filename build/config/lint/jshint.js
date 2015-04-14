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
  lib: {
    src: ['src/lib/**/*.js'],
    options: {
      jshintrc: 'src/lib/.jshintrc',
    },
  },
  html: {
    src: [
      'src/bindings/html/**/*.js',
      'src/runtime/web/**/*.js'
    ],
    options: {
      jshintrc: 'src/bindings/html/.jshintrc',
    },
  },
  tests: {
    src: ['tests/**/*.js'],
    options: {
      jshintrc: 'tests/.jshintrc',
    },
  },
};
