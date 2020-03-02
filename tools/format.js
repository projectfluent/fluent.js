#!/usr/bin/env node

'use strict';

require('colors');
const fs = require('fs');
const program = require('commander');

require = require('esm')(module);
require('intl-pluralrules');
const Fluent = require('../fluent-bundle/esm/index.js');

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
  const parseErrors = bundle.addResource(
    new Fluent.FluentResource(data.toString()));

  parseErrors.forEach(printError);

  for (let [id, message] of bundle._messages) {
    const formatErrors = [];
    if (message.value) {
      printEntry(id, bundle.formatPattern(message.value, ext, formatErrors));
    } else {
      printEntry(id, "");
    }
    for (let [name, attr] of Object.entries(message.attributes)) {
      printEntry(`    .${name}`, bundle.formatPattern(attr, ext, formatErrors));
    }
    formatErrors.forEach(printError);
  }
}

if (program.args.length) {
  fs.readFile(program.args[0], print);
} else {
  process.stdin.resume();
  process.stdin.on('data', data => print(null, data));
}
