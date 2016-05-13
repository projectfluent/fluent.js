#!/usr/bin/env node

'use strict';

require('colors');
var fs = require('fs');
var program = require('commander');
var prettyjson = require('prettyjson');

require('babel-register')({
  plugins: ['transform-es2015-modules-commonjs']
});

const FTLASTParser = require('../src/lib/format/ftl/ast/parser').default;
const FTLRuntimeParser = require('../src/lib/format/ftl/entries/parser').default;
const { createEntriesFromAST } = require('../src/lib/format/ftl/entries/transformer');

program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-o, --output <type>',
    'Type of output: ast or entries [ast]', 'ast')
  .option('-i, --input <type>',
    'Input syntax; only ftl is supported right now [ftl]', 'ftl')
  .option('-t, --transform',
    'Use AST transformer to produce the output', false)
  .option('-r, --raw', 'Print raw JSON')
  .option('-n, --no-color', 'Print errors to stderr without color')
  .parse(process.argv);


function parse(fileformat, str) {
  if (program.output === 'ast') {
    return FTLASTParser.parseResource(str);
  } else if (program.transform) {
    const parsed = FTLASTParser.parseResource(str);
    return createEntriesFromAST(parsed);
  } else {
    return FTLRuntimeParser.parseResource(str);
  }
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

    var ctx = '\x1b[2m' + error.context.slice(0, error.offset) + '\x1b[22m' +
      '\x1b[91m' + error.context.slice(error.offset) + '\x1b[0m';

    var msg = '\x1b[4m' + error.description + '\x1b[0m'  +
      ' at pos [' + error._pos.row + ',' + error._pos.col + ']' +
      ': `' + ctx.replace(/\s+/g, ' ') + '`';
    console.log((parseInt(i) + 1) + ') ' + msg);
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
