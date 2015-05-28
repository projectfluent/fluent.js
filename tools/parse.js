#!/usr/bin/env node

'use strict';

require('babel/register');

var fs = require('fs');
var program = require('commander');
var prettyjson = require('prettyjson');
var colors = require('colors');

var PropertiesParser =
  require('../src/lib/format/properties/parser');
var L20nParser = require('../src/lib/format/l20n/parser');


program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-r, --raw', 'Print raw JSON')
  .option('-n, --no-color', 'Print errors to stderr without color')
  .parse(process.argv);

function color(str, col) {
  if (program.color) {
    return str[col];
  }
  return str;
}

function logError(err) {
  var message  = ': ' + err.message.replace('\n', '');
  var name = err.name + (err.entry ? ' in ' + err.entry : '');
  console.warn(color(name, 'red') + message);
}

function print(type, err, data) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }
  var ast;
  try {
    switch (type) {
      case 'properties':
        ast = PropertiesParser.parse(null, data.toString());
        break;
      case 'l20n':
        ast = L20nParser.parse(null, data.toString());
        break;
    }

  } catch (e) {
    console.log(e);
    logError(e);
  }
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
  var type = program.args[0].substr(program.args[0].lastIndexOf('.') + 1);
  fs.readFile(program.args[0], print.bind(null, type));
} else {
  process.stdin.resume();
  process.stdin.on('data', print.bind(null, null));
}
