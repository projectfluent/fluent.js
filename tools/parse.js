#!/usr/bin/env node

'use strict';

var fs = require('fs');
var program = require('commander');

require('babel-register')({
  plugins: ['transform-es2015-modules-commonjs']
});

program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-r, --runtime', 'Use the runtime parser')
  .option('-s, --silent', 'Silence syntax errors')
  .parse(process.argv);

const parse = program.runtime
  ? require('../src/intl/parser').default
  : require('../src/syntax/parser').parse;

const formatSlice = require('./error_display').formatSlice;

function print(path, err, data) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }

  const [result, errors] = parse(data.toString());
  console.log(JSON.stringify(result, null, 2));

  if (errors.length && !program.silent) {
    for (let e of errors) {
      let slice = formatSlice({
        source: path,
        content: e.info.slice,
        lineNum: e.info.line,
        type: 'error',
        desc: e.message,
        pos: e.info.pos,
        labels: [{
          type: 'primary',
          mark: [e.info.pos, e.info.pos + 1],
          desc: ''
        }],
        blocks: [],
      });
      console.error(slice);
    }
  }

}

if (program.args.length) {
  fs.readFile(program.args[0], print.bind(null, program.args[0]));
} else {
  process.stdin.resume();
  process.stdin.on('data', print.bind(null, 'stdin'));
}
