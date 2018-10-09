#!/usr/bin/env node

'use strict';

require('colors');
const fs = require('fs');
const program = require('commander');

require('@babel/register')({
  plugins: [
    '@babel/plugin-proposal-async-generator-functions',
  ]
});
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

function color(str, col) {
  return (program.color && col && str) ?
    str[col] : str;
};

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

function printEntry(id, val) {
  console.log(
    color(id, 'cyan'),
    color(singleline(val))
  );
}

function print(err, data) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }

  const bundle = new Fluent.FluentBundle(program.lang);
  const parseErrors = bundle.addMessages(data.toString());

  parseErrors.forEach(printError);

  for (const [id, message] of bundle.messages) {
    const formatErrors = [];
    printEntry(id, bundle.format(message, ext, formatErrors));
    formatErrors.forEach(printError);
  }
}

if (program.args.length) {
  fs.readFile(program.args[0], print);
} else {
  process.stdin.resume();
  process.stdin.on('data', data => print(null, data));
}
