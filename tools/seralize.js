#!/usr/bin/env node

'use strict';

require('colors');
var fs = require('fs');
var program = require('commander');
var prettyjson = require('prettyjson');

var lib = require('./lib');

program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-i, --input <type>',
    'Input data type: only ast is supported [ast]', 'ast')
  .option('-o, --output <type>',
    'Output syntax; only ftl is supported right now [ftl]', 'ftl')
  .parse(process.argv);


function print(path, err, data) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }

  let ast;

  if (path.endsWith('.ftl')) {
    const resource = data.toString();
    [ast,] = lib.parse('ftl', 'ast', resource);
  } else {
    ast = JSON.parse(data.toString());
  }
  const out = lib.serialize(program.output, program.input, ast);
  console.log(out);
}

if (program.args.length) {
  fs.readFile(program.args[0], print.bind(null, program.args[0]));
} else {
  process.stdin.resume();
  process.stdin.on('data', print);
}
