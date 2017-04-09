#!/usr/bin/env node

'use strict';

const fs = require('fs');
const program = require('commander');
const fuzzer = require('fuzzer');

require('babel-register')({
  plugins: ['transform-es2015-modules-commonjs']
});

const FluentSyntax = require('../fluent-syntax/src');

fuzzer.seed(Math.random() * 1000000000);

program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-r, --runtime', 'Use the runtime parser')
  .option('-i, --reps', 'Number of repetitions')
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

  (program.runtime
    ? printRuntime
    : printResource
  )(data);
}

function printRuntime(data) {
  const parse = require('../fluent/src/parser').default;
  const [res, errors] = parse(data.toString());
  console.log(JSON.stringify(res, null, 2));

  if (!program.silent) {
    errors.map(e => console.error(e.message));
  }
}

function printResource(data) {
  const source = data.toString();
  const combinations = new Set();

  for (var i = 0; i < 100000;) {
    console.log(i);
    const modifiedSource = fuzzer.mutate.string(source);
    //console.log(modifiedSource);
    if (!combinations.has(modifiedSource)) {
      combinations.add(modifiedSource);
      i++;
    }
    try  {
      const res = FluentSyntax.parse(modifiedSource);
    } catch (e) {
      console.log(`==== rep: ${i} ======`);
      console.log(e);
      console.log(modifiedSource);
      break;
    }
  }

  // for (let s of combinations) {
  //   console.log(s);
  // }
  // console.log(combinations.size);
}
