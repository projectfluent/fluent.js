#!/usr/bin/env node

'use strict';

require('colors');
var fs = require('fs');
var program = require('commander');

require('babel-register')({
  presets: ['es2015']
});
var Resolver = require('../src/lib/resolver');
var mocks = require('../src/lib/mocks');
var lang = require('../src/lib/mocks').lang;
var lib = require('./lib');
var color = lib.color.bind(program);

program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-d, --data <file>', 'Context data to use (.json)')
  .option('-a, --ast', 'Treat input as AST, not source code')
  .option('-n, --no-color', 'Print without color')
  .option('-l, --with-local', 'Print local entities and attributes')
  .option('-p, --plural <locale>', 'Select the plural rule [en-US]', 'en-US')
  .parse(process.argv);


var data = {};
if (program.data) {
  data = JSON.parse(fs.readFileSync(program.data, 'utf8'));
}

function printError(err) {
  return console.log(
    color(err.name + ': ' + err.message, 'red')
  );
};

function singleline(str) {
  return str && str
    .replace(/\n/g, ' ')
    .trim();
}

function printEntry(ctx, id, entity) {
  const formatted = Resolver.format(ctx, lang, data, entity);

  if (formatted[0].length) {
    formatted[0].forEach(printError);
  }

  console.log(
    color(id, 'cyan'),
    color(singleline(formatted[1]))
  );
}

function print(fileformat, err, data) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }

  var ast;
  if (program.ast) {
    ast = JSON.parse(data.toString());
  } else {
    try {
      ast = lib.parse(fileformat, 'ast', data.toString());
    } catch (e) {
      console.error(printError(e));
      process.exit(1);
    }
  }

  var entries = mocks.createEntriesFromAST(ast);
  var ctx = new mocks.MockContext(entries);

  for (var id in entries) {
    printEntry(ctx, id, entries[id]);
  }
}

if (program.args.length) {
  var fileformat = program.args[0].substr(program.args[0].lastIndexOf('.') + 1);
  fs.readFile(program.args[0], print.bind(null, fileformat));
} else {
  process.stdin.resume();
  process.stdin.on('data', print.bind(null, null, null));
}
