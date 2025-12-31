#!/usr/bin/env node

import { readFile } from "fs";
import program from "commander";
import { FluentResource } from "@fluent/bundle";
import { columnOffset, lineOffset, parse } from "@fluent/syntax";

program
  .version("0.0.1")
  .usage("[options] [file]")
  .option("-r, --runtime", "Use the runtime parser")
  .option("-s, --silent", "Silence syntax errors")
  .option("--with-spans", "Compute spans of AST nodes")
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

  (program.runtime ? printRuntime : printResource)(data);
}

function printRuntime(data) {
  const res = new FluentResource(data.toString());
  console.log(JSON.stringify(res, null, 4));
}

function printResource(data) {
  const withSpans = !!program.withSpans;
  const source = data.toString();
  const res = parse(source, { withSpans });
  console.log(JSON.stringify(res, null, 2));

  if (!program.silent) {
    // Spans are required to pretty-print the annotations. If needed, re-parse
    // the source.
    const { body } = withSpans ? res : parse(source, { withSpans: true });
    body
      .filter(entry => entry.type === "Junk")
      .map(junk => printAnnotations(source, junk));
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
