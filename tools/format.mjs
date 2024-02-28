#!/usr/bin/env node

import "colors";
import { readFile, readFileSync } from "fs";
import program from "commander";

import { FluentBundle, FluentResource } from "../fluent-bundle/esm/index.js";

program
  .version("0.0.1")
  .usage("[options] [file]")
  .option("-e, --external <file>", "External arguments (.json)")
  .option("-n, --no-color", "Print without color")
  .option("-l, --lang <code>", "Locale to use with Intl [en-US]", "en-US")
  .parse(process.argv);

const ext = program.external
  ? JSON.parse(readFileSync(program.external, "utf8"))
  : {};

function color(str, col) {
  return program.color && col && str ? str[col] : str;
}

function printError(err) {
  return console.log(color(err.name + ": " + err.message, "red"));
}

function singleline(str) {
  return str && str.replace(/\n/g, " ").trim();
}

function printEntry(id, val) {
  console.log(color(id, "cyan"), color(singleline(val)));
}

function print(err, data) {
  if (err) {
    return console.error("File not found: " + err.path);
  }

  const bundle = new FluentBundle(program.lang);
  const parseErrors = bundle.addResource(new FluentResource(data.toString()));

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
  readFile(program.args[0], print);
} else {
  process.stdin.resume();
  process.stdin.on("data", data => print(null, data));
}
