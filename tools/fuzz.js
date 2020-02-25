#!/usr/bin/env node

'use strict';

const fs = require('fs');
const readline = require('readline');
const program = require('commander');
const fuzzer = require('fuzzer');

require = require('esm')(module);

fuzzer.seed(Math.random() * 1000000000);

program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-r, --runtime', 'Use the runtime parser')
  .option('-i, --repetitions <int>', 'Number of repetitions [100000]', 100000)
  .parse(process.argv);

if (program.args.length) {
  fs.readFile(program.args[0], fuzz);
} else {
  process.stdin.resume();
  process.stdin.on('data', data => fuzz(null, data));
}

function fuzz(err, data) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }

  let parse;
  if (program.runtime) {
    let {FluentResource} = require('../fluent-bundle/esm/index.js');
    parse = source => new FluentResource(source);
  } else {
    parse = require('../fluent-syntax/esm/index.js').parse;
  }

  const source = data.toString();
  const mutations = new Set();

  let i = 1;

  while (i <= program.repetitions) {
    const mutated = fuzzer.mutate.string(source);

    if (mutations.has(mutated)) {
      continue;
    }

    mutations.add(mutated);

    const progress = Math.round(i / program.repetitions * 100);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`mutation ${i} ... ${progress}%`);

    try  {
      parse(mutated);
    } catch (e) {
      console.log(`! mutation ${i}`);
      console.log(e);
      console.log(mutated);
      break;
    }

    i++;
  }
}
