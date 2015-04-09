'use strict';

var DEBUG = (typeof process === 'undefined') ?
  true : !!process.env.DEBUG;

function debug() {
  if (!DEBUG) {
    return;
  }

  // concat adjecent strings together
  var args = Array.prototype.reduce.call(arguments, function(seq, cur) {
    if (typeof seq[seq.length - 1] === 'string' && typeof cur === 'string') {
      var last = seq.pop() + ' ' + cur;
      return seq.concat(last);
    } else {
      return seq.concat(cur);
    }
  }, ['--']);

  console.log.apply(console, args);
}

exports.debug = debug;
