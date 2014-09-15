'use strict';

var DEBUG = !!process.env.DEBUG;

function debug() {
  if (!DEBUG) {
    return;
  }

  var args = Array.prototype.slice.call(arguments);

  var emitter = args.shift();
  if (emitter) {
    emitter.emit.apply(emitter, 'debug', args);
  }

  console.log('-- ' + args.join(' '));

}

exports.debug = debug;
