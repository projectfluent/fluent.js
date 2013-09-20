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
    src: ['{lib,src}/**/*.js'],
    options: {
      jshintrc: 'lib/.jshintrc',
    },
  },
  tests: {
    src: ['tests/**/*.js'],
    options: {
      jshintrc: 'tests/.jshintrc',
    },
  },
};
