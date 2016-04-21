'use strict';

module.exports = {
  unit: {
    basePath: '',
    frameworks: ['mocha', 'chai'],
    files: [
      { src: 'dist/bundle/testing/*.js' },
      { src: 'tests/bindings/*.js' }
    ],
    browsers: ['Firefox', 'Chrome'],
    port: 9876,
    colors: true,
    logLevel: 'INFO',
    autoWatch: false,
    singleRun: true
  }
};
