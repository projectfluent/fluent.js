#!/usr/bin/env node

'use strict';

require('../node_modules/babel-core/register');

var program = require('commander');
var qps = require('../src/lib/pseudo').qps;

program
  .version('0.0.1')
  .usage('[options]')
  .option('-l, --locale <code>',
          'Pseudolocale to use: qps-ploc (default), qps-plocm',
          'qps-ploc')
  .parse(process.argv);

function localize(str) {
  return qps[program.locale].translate(str);
}

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    process.stdout.write(localize(chunk));
  }
  process.stdout.write('> ');
});
