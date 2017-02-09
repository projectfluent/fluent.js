#!/usr/bin/env node

'use strict';

require('colors');
var fs = require('fs');
var program = require('commander');
var prettyjson = require('prettyjson');

require('babel-register')({
  plugins: ['transform-es2015-modules-commonjs']
});

const parse_ast = require('../src/syntax/parser').parse;
const parse_rt = require('../src/intl/parser').default;

program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-o, --output <type>',
    'Type of output: ast or entries [ast]', 'ast')
  .option('-r, --raw', 'Print raw JSON')
  .option('-n, --no-color', 'Print errors to stderr without color')
  .parse(process.argv);


function parse(fileformat, str) {
  return program.output === 'ast'
    ? parse_ast(str)
    : parse_rt(str);
}


function print(fileformat, err, data) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }

  const [result, errors] = parse(fileformat, data.toString());

  if (program.raw) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(prettyjson.render(result, {
      keysColor: 'cyan',
      dashColor: 'cyan',
    }));
    if (errors.length) {
      printErrors(errors);
    }
  }
}

function printErrors(errors) {
  console.log('Syntax errors:');
  for (var i in errors) {
    var error = errors[i];

    console.error(error);
  }
}

if (program.args.length) {
  var fileformat = program.args[0].substr(
    program.args[0].lastIndexOf('.') + 1) || program.input;
  fs.readFile(program.args[0], print.bind(
    null, fileformat));
} else {
  process.stdin.resume();
  process.stdin.on('data', print.bind(
    null, program.input, null));
}
