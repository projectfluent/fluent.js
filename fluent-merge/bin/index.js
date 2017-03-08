#!/usr/bin/env node

'use strict';

const program = require('commander');
const { readFile } = require('./fs');

require('babel-register')({
  plugins: ['transform-es2015-modules-commonjs']
});

const { mergeFiles } = require('../src');

program
  .version('0.0.1')
  .usage('[options] [files]')
  .parse(process.argv);

if (program.args.length === 0) {
  process.exit(1);
}

Promise.all(
  program.args.map(
    path => readFile(path)
  )
).then(buffers => {
  const files = buffers.map(buffer => buffer.toString());
  const merged = mergeFiles(...files);
  console.log(merged);
}).catch(console.error);
