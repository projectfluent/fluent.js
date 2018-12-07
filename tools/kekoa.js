#!/usr/bin/env node

'use strict';

require('colors');
const fs = require('fs');
const program = require('commander');

require = require('esm')(module);
require('../fluent-intl-polyfill/src');
const Fluent = require('../fluent/src');

program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-e, --external <file>', 'External arguments (.json)')
  .option('-n, --no-color', 'Print without color')
  .option('-l, --lang <code>', 'Locale to use with Intl [en-US]', 'en-US')
  .parse(process.argv);

const ext = program.external ?
  JSON.parse(fs.readFileSync(program.external, 'utf8')) : {};

function print(err, data) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }
  const bundle = new Fluent.FluentBundle(program.lang);
  const parseErrors = bundle.addMessages(data.toString());

  const formatErrors = [];
  console.log(bundle.compound('foo', ext, formatErrors));

  console.log(bundle.compound('bar', ext, formatErrors));

  console.log(bundle.compound('baz', ext, formatErrors)); 
  console.log(bundle.format('baz', ext, formatErrors));
  console.log(bundle.format('baz.snake', ext, formatErrors));
  console.log(bundle.format('baz.elephant', ext, formatErrors));  

  console.log(bundle.format('xxx', ext, formatErrors));
  console.log(bundle.compound('xxx', ext, formatErrors));

  // console.log(formatErrors);
};

if (program.args.length) {
  fs.readFile(program.args[0], print);
} else {
  process.stdin.resume();
  process.stdin.on('data', data => print(null, data));
}