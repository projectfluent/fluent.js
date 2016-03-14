'use strict';

require('babel-register')({
  presets: ['es2015']
});

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
