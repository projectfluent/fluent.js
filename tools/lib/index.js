'use strict';

/* jshint node:true */

require('colors');
require('babel-register')({
  presets: ['es2015']
});
exports.parse = function(fileformat, output, text) {
  var module = fileformat === 'properties' ?
    '../../src/lib/format/properties/parser' :
    '../../src/lib/format/' + fileformat + '/' + output + '/parser';

  return require(module).default.parseResource(text);
};

exports.color = function(str, col) {
  if (this.color && col && str) {
    return str[col];
  }
  return str;
};
