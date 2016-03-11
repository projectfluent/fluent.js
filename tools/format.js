#!/usr/bin/env node

'use strict';

require('colors');
var fs = require('fs');
var program = require('commander');

require('babel-register')({
  presets: ['es2015']
});
var Resolver = require('../src/lib/resolver');
var MockContext = require('../tests/lib/resolver/header').MockContext;
var lang = require('../src/lib/mocks').lang;
var lib = require('./lib');
var color = lib.color.bind(program);
var makeError = lib.makeError.bind(program);

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

function singleline(formatted) {
  var str = formatted[1];
  return str && str.replace(/\n/g, ' ')
                   .replace(/\s{3,}/g, ' ')
                   .trim();
}

function format(ctx, entity) {
  try {
    return singleline(Resolver.format(ctx, lang, data, entity));
  } catch(err) {
    return makeError(err);
  }
}

function printEntry(ctx, id, entity) {
  console.log(
    color(id, 'cyan'),
    color(format(ctx, entity)));

  for (var attr in entity.attrs) {
    console.log(
      color(' ::' + attr, 'cyan'),
      color(format(ctx, entity.attrs[attr])));
  }
}

function print(fileformat, err, data) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }

  var entries;
  if (program.ast) {
    entries = JSON.parse(data.toString());
  } else {
    try {
      entries = lib.parse(fileformat, 'entries', data.toString());
    } catch (e) {
      console.error(makeError(e));
      process.exit(1);
    }
  }

  var ctx = new MockContext(entries);

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
