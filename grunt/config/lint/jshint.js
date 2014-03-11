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
    src: ['lib/**/*.js'],
    options: {
      jshintrc: 'lib/.jshintrc',
    },
  },
  bindings: {
    src: ['bindings/**/*.js'],
    options: {
      jshintrc: 'bindings/.jshintrc',
    },
  },
};
