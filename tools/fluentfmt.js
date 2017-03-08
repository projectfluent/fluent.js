#!/usr/bin/env node

'use strict';

const fs = require('fs');
const program = require('commander');

require('babel-register')({
  plugins: ['transform-es2015-modules-commonjs']
});

const FluentSyntax = require('../fluent-syntax/src');

program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-s, --silent', 'Silence syntax errors')
  .parse(process.argv);

if (program.args.length) {
  fs.readFile(program.args[0], print);
} else {
  process.stdin.resume();
  process.stdin.on('data', data => print(null, data));
}

function print(err, data) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }

  const res = FluentSyntax.parse(data.toString());
  const pretty = FluentSyntax.serialize(res);
  console.log(pretty);

  if (!program.silent) {
    res.body.map(entry => printAnnotations(res.source, entry));
  }
}

function printAnnotations(source, entry) {
  const { span, annotations } = entry;
  for (const annot of annotations) {
    printAnnotation(source, span, annot);
  }
}

function printAnnotation(source, span, annot) {
  const { name, message, pos } = annot;
  const slice = source.substring(span.from, span.to).trimRight();
  const lineNumber = FluentSyntax.lineOffset(source, pos) + 1;
  const columnOffset = FluentSyntax.columnOffset(source, pos);
  const showLines = lineNumber - FluentSyntax.lineOffset(source, span.from);
  const lines = slice.split('\n');
  const head = lines.slice(0, showLines);
  const tail = lines.slice(showLines);

  console.log();
  console.log(`! ${name} on line ${lineNumber}:`);
  console.log(head.map(line => `  | ${line}`).join('\n'));
  console.log(`  … ${indent(columnOffset)}^----- ${message}`);
  console.log(tail.map(line => `  | ${line}`).join('\n'));
}

function indent(spaces) {
  return new Array(spaces + 1).join(' ');
}
