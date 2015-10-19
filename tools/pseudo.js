#!/usr/bin/env node

'use strict';

require('../node_modules/babel-core/register');

var program = require('commander');
var pseudo = require('../src/lib/pseudo').pseudo;

program
  .version('0.0.1')
  .usage('[options]')
  .option('-l, --locale <code>',
          'Pseudolocale to use: fr-x-psaccent (default), ar-x-psbidi',
          'fr-x-psaccent')
  .parse(process.argv);

function localize(str) {
  return pseudo[program.locale].process(str);
}

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    process.stdout.write(localize(chunk));
  }
  process.stdout.write('> ');
});
