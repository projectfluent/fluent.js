'use strict';

var DEBUG = (typeof process === 'undefined') ?
  true : !!process.env.DEBUG;

function debug() {
  if (!DEBUG) {
    return;
  }

  var args = Array.prototype.slice.call(arguments);
  console.log.apply(console, ['--'].concat(args));
}

exports.debug = debug;
