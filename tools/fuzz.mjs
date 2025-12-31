#!/usr/bin/env node

"use strict";

import { readFile } from "fs";
import { cursorTo } from "readline";
import program from "commander";
import { mutate, seed } from "fuzzer";
import { FluentResource } from "@fluent/bundle";
import { parse } from "@fluent/syntax";

seed(Math.random() * 1000000000);

program
  .version("0.0.1")
  .usage("[options] [file]")
  .option("-r, --runtime", "Use the runtime parser")
  .option("-i, --repetitions <int>", "Number of repetitions [100000]", 100000)
  .parse(process.argv);

if (program.args.length) {
  readFile(program.args[0], fuzz);
} else {
  process.stdin.resume();
  process.stdin.on("data", data => fuzz(null, data));
}

function fuzz(err, data) {
  if (err) {
    return console.error("File not found: " + err.path);
  }

  let parse_;
  if (program.runtime) {
    parse_ = source => new FluentResource(source);
  } else {
    parse_ = parse;
  }

  const source = data.toString();
  const mutations = new Set();

  let i = 1;

  while (i <= program.repetitions) {
    const mutated = mutate.string(source);

    if (mutations.has(mutated)) {
      continue;
    }

    mutations.add(mutated);

    const progress = Math.round((i / program.repetitions) * 100);
    cursorTo(process.stdout, 0);
    process.stdout.write(`mutation ${i} ... ${progress}%`);

    try {
      parse_(mutated);
    } catch (e) {
      console.log(`! mutation ${i}`);
      console.log(e);
      console.log(mutated);
      break;
    }

    i++;
  }
}
