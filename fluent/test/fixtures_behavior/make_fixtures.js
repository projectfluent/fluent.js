#!/usr/bin/env node

'use strict';

const fs = require('fs');
const program = require('commander');

require = require('esm')(module);
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

function isLocalizable(entry) {
  return entry.type === 'Message' || entry.type === 'Term';
}

function printEntries(source) {
  const {body} = parser.parse(source);
  const entries = {};

  for (const entry of body.filter(isLocalizable)) {
    const id = entry.type === 'Term'
      ? `-${entry.id.name}` : entry.id.name;
    const expected = entries[id] = {};

    if (entry.value !== null) {
      expected.value = true;
    }

    if (entry.attributes.length > 0) {
      expected.attributes = {};

      for (const attr of entry.attributes) {
        expected.attributes[attr.id.name] = true
      }
    }

  }

  console.log(JSON.stringify(entries, null, 2));
}
