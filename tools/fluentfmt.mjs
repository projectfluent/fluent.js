#!/usr/bin/env node

"use strict";

import { readFile } from "fs";
import program from "commander";
import { columnOffset, lineOffset, parse, serialize } from "@fluent/syntax";

program
  .version("0.0.1")
  .usage("[options] [file]")
  .option("-s, --silent", "Silence syntax errors")
  .parse(process.argv);

if (program.args.length) {
  readFile(program.args[0], print);
} else {
  process.stdin.resume();
  process.stdin.on("data", data => print(null, data));
}

function print(err, data) {
  if (err) {
    return console.error("File not found: " + err.path);
  }

  const source = data.toString();
  const res = parse(source, { withSpans: true });
  const pretty = serialize(res);
  console.log(pretty);

  if (!program.silent) {
    res.body
      .filter(entry => entry.type === "Junk")
      .map(entry => printAnnotations(source, entry));
  }
}

function printAnnotations(source, junk) {
  const { span, annotations } = junk;
  for (const annot of annotations) {
    printAnnotation(source, span, annot);
  }
}

function printAnnotation(source, span, annot) {
  const {
    code,
    message,
    span: { start },
  } = annot;
  const slice = source.substring(span.start, span.end);
  const lineNumber = lineOffset(source, start) + 1;
  const columnNumber = columnOffset(source, start);
  const showLines = lineNumber - lineOffset(source, span.start);
  const lines = slice.split("\n");
  const head = lines.slice(0, showLines);
  const tail = lines.slice(showLines);

  console.log();
  console.log(`! ${code} on line ${lineNumber}:`);
  console.log(head.map(line => `  | ${line}`).join("\n"));
  console.log(`  … ${indent(columnNumber)}^----- ${message}`);
  console.log(tail.map(line => `  | ${line}`).join("\n"));
}

function indent(spaces) {
  return new Array(spaces + 1).join(" ");
}
