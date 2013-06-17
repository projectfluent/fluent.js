#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var prettyjson = require('prettyjson');
var colors = require('colors');

var Parser = require('../lib/l20n/parser').Parser;

program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-r, --raw', 'Print raw JSON')
  .option('-n, --no-color', 'Print errors to stderr without color')
  .parse(process.argv);

var parser = new Parser();
parser.addEventListener('error', logError);

function color(str, col) {
  if (program.color) {
    return str[col];
  }
  return str;
}

function logError(err) {
  var error = {};
  var message  = ': ' + err.message.replace('\n', '');
  var name = err.name + (err.entry ? ' in ' + err.entry : '');
  console.warn(color(name, 'red') + message);
}

function print(err, data) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }
  var ast = parser.parse(data.toString()); 
  if (program.raw) {
    console.log(JSON.stringify(ast, null, 2));
  } else {
    console.log(prettyjson.render(ast, {
      keysColor: 'cyan',
      dashColor: 'cyan',
    }));
  }
}

if (program.args.length) {
  fs.readFile(program.args[0], print);
} else {
  process.stdin.resume();
  process.stdin.on('data', print.bind(null, null));
}
