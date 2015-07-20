'use strict';

/* jshint node:true */

require('colors');
require('../../node_modules/babel-core/register');

exports.parse = function(fileformat, output, text) {
  var module = fileformat === 'properties' ?
    '../../src/lib/format/properties/parser' :
    '../../src/lib/format/' + fileformat + '/' + output + '/parser';

  if (fileformat === 'l20n' && output === 'ast') {
    return require(module).parseResource(text);
  }
  return require(module).parse(null, text);
};

exports.color = function(str, col) {
  if (this.color && col && str) {
    return str[col];
  }
  return str;
};

exports.makeError = function(err) {
  var message  = ': ' + err.message.replace('\n', '');
  var name = err.name + (err.entry ? ' in ' + err.entry : '');
  return exports.color.call(this, name + message, 'red');
};
