'use strict';

require('../node_modules/babel-core/register');

var src = [
  'tests/lib/parser/ftl/*.js',
];

module.exports = {
  dot: {
    options: {
      reporter: 'dot',
    },
    src: src,
  }
};
