'use strict';

var path = require('path').resolve.bind(null, __dirname);

exports.babel = {
  test: /\.js$/,
  include: [
    path('../../src')
  ],
  loader: 'babel',
  query: {
    loose: 'all',
    comments: false,
    optional: [
      'es6.spec.blockScoping',
      'runtime',
      'minification.deadCodeElimination',
      'minification.constantFolding',
      'minification.memberExpressionLiterals',
      'minification.propertyLiterals',
      'minification.removeDebugger',
      'validation.undeclaredVariableCheck',
    ],
    whitelist: [
      'strict',
      'es6.modules',
      'es6.classes',
      'es6.constants',
      'es6.destructuring',
      'es6.arrowFunctions',
      'es6.properties.shorthand',
      'es6.forOf',
      'es6.spread',
      'es6.parameters',
      'es6.blockScoping'
    ],
  }
};
