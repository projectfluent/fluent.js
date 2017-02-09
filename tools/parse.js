#!/usr/bin/env node

'use strict';

var fs = require('fs');
var program = require('commander');

require('babel-register')({
  plugins: ['transform-es2015-modules-commonjs']
});

program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-r, --runtime', 'Use the runtime parser')
  .option('-s, --silent', 'Silence syntax errors')
  .parse(process.argv);

const parse = program.runtime
  ? require('../src/intl/parser').default
  : require('../src/syntax/parser').parse;

function print(err, data) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }

  const [result, errors] = parse(data.toString());
  console.log(JSON.stringify(result, null, 2));

  if (errors.length && !program.silent) {
    errors.map(e => console.error(e.message));
  }
}

if (program.args.length) {
  fs.readFile(program.args[0], print);
} else {
  process.stdin.resume();
  process.stdin.on('data', print);
}
