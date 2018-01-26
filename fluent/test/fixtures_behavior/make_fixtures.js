#!/usr/bin/env node

'use strict';

const fs = require('fs');
const program = require('commander');

require('babel-register')({
  plugins: ['transform-es2015-modules-commonjs']
});

const FluentSyntax = require('../../../fluent-syntax/src');
const parser = new FluentSyntax.FluentParser({
  withSpans: false,
});

program
  .version('0.0.1')
  .usage('<file>')
  .parse(process.argv);

if (program.args.length === 0) {
  program.help();
} else {
  fs.readFile(program.args[0], print);
}

function print(err, data) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }

  printEntries(data.toString());
}

function printEntries(source) {
  const {body} = parser.parse(source);
  const messages = body.filter(elem => elem.type === 'Message');

  const entries = {};

  for (const msg of messages) {
    const entry = entries[msg.id.name] = {};

    if (msg.value !== null) {
      entry.value = true;
    }

    if (msg.attributes.length > 0) {
      entry.attributes = {};

      for (const attr of msg.attributes) {
        entry.attributes[attr.id.name] = true
      }
    }

  }

  console.log(JSON.stringify(entries, null, 2));
}
