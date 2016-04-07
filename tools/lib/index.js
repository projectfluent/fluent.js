'use strict';

/* jshint node:true */

require('babel-register')({
  presets: ['es2015']
});

exports.parse = function(fileformat, output, text) {
  var module = '../../src/lib/format/' + fileformat + '/' + output + '/parser';
  return require(module).default.parseResource(text);
};

exports.transform = function(fileformat, output, ast) {
  var module = '../../src/lib/format/' + fileformat + '/' + output + '/transformer';
  return require(module).createEntriesFromAST(ast);
};

exports.color = function(str, col) {
  if (this.color && col && str) {
    return str[col];
  }
  return str;
};
