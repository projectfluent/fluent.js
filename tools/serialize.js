#!/usr/bin/env node

'use strict';

const fs = require('fs');
const program = require('commander');

require('@babel/register')({
  plugins: ["@babel/plugin-transform-modules-commonjs"]
});
const FluentSyntax = require('../fluent-syntax/src');

program
  .version('0.0.1')
  .usage('[options] [file]')
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

  const res = JSON.parse(data);
  const pretty = FluentSyntax.serialize(res);
  console.log(pretty);
}
