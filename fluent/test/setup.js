'use strict';

require('babel-register')({
  babelrc: false,
  plugins: ['transform-es2015-modules-commonjs']
});

require('../../fluent-intl-polyfill/src');
