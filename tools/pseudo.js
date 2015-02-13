#!/usr/bin/env node

'use strict';

var program = require('commander');
var PSEUDO = require('../lib/l20n/pseudo').PSEUDO;

program
  .version('0.0.1')
  .usage('[options]')
  .option('-l, --locale <code>',
          'Pseudolocale to use: qps-ploc (default), qps-plocm',
          'qps-ploc')
  .parse(process.argv);

function localize(str) {
  return PSEUDO[program.locale].translate(str);
}

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    process.stdout.write(localize(chunk));
  }
  process.stdout.write('> ');
});
