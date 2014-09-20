'use strict';

var DEBUG = true || !!process.env.DEBUG;

function debug() {
  if (!DEBUG) {
    return;
  }

  var args = Array.prototype.slice.call(arguments);
  console.log('-- ' + args.join(' '));

}

exports.debug = debug;
