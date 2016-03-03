#!/usr/bin/env node

'use strict';

require('colors');
var fs = require('fs');
var program = require('commander');

require('../node_modules/babel-core/register');
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

function singleline(str) {
  return str && str
    .replace(/^\s{3,}/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

function format(ctx, entity) {
  const formatted = Resolver.format(ctx, lang, data, entity);
  if (formatted[0].length) {
    return makeError(formatted[0][0]);
  }

  return singleline(formatted[1]);
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

  var ast;
  if (program.ast) {
    ast = JSON.parse(data.toString());
  } else {
    try {
      ast = lib.parse(fileformat, 'ast', data.toString());
    } catch (e) {
      console.error(makeError(e));
      process.exit(1);
    }
  }

  var entries = ast.body.reduce(
    (seq, cur) => Object.assign(seq, {
      [cur.id.name]: cur
    }), {}
  );

  var ctx = new MockContext(entries);

  for (var id in entries) {
    // console.log(JSON.stringify(entries[id], null, 4));
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
