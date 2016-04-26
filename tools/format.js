#!/usr/bin/env node

'use strict';

require('colors');
var fs = require('fs');
var program = require('commander');

require('babel-register')({
  plugins: ['transform-es2015-modules-commonjs']
});

var Resolver = require('../src/lib/resolver');
var mocks = require('../src/lib/mocks');
var lib = require('./lib');
var color = lib.color.bind(program);

program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-d, --data <file>', 'Context data to use (.json)')
  .option('-n, --no-color', 'Print without color')
  .option('-l, --lang <code>', 'Locale to use with Intl [en-US]', 'en-US')
  .parse(process.argv);

const lang = { code: program.lang, src: 'app' };

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

  const parsed = lib.parse(fileformat, 'entries', data.toString());

  parsed._errors.forEach(printError);

  const ctx = new mocks.MockContext(parsed.entries);
  for (let id in parsed.entries) {
    printEntry(ctx, id, parsed.entries[id]);
  }
}

if (program.args.length) {
  var fileformat = program.args[0].substr(program.args[0].lastIndexOf('.') + 1);
  fs.readFile(program.args[0], print.bind(null, fileformat));
} else {
  process.stdin.resume();
  process.stdin.on('data', print.bind(null, null, null));
}
