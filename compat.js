'use strict';

// If L20n was installed via npm, you can require it from node using one of the 
// following two methods:
//
//   require('babel/register');
//   require('l20n');
//
// or
//
//   require('l20n/compat');
//
// The compat version is transpiled to ES5 and doesn't require the Babel 
// runtime.

module.exports = require('./dist/node/l20n');
