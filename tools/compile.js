#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var colors = require('colors');

var Parser = require('../lib/l20n/parser').Parser;
var compile = require('../lib/l20n/compiler').compile;
var getPluralRule = require('../lib/l20n/plurals').getPluralRule;

program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-d, --data <file>', 'Context data to use (.json)')
  .option('-a, --ast', 'Treat input as AST, not source code')
  .option('-n, --no-color', 'Print without color')
  .option('-l, --with-local', 'Print local entities and attributes')
  .option('-p, --plural <locale>', 'Select the plural rule [en-US]', 'en-US')
  .parse(process.argv);

var parser = new Parser();
parser._emitter.addEventListener('error', logError);

var data = {};
if (program.data) {
  data = JSON.parse(fs.readFileSync(program.data, 'utf8'));
}

var ID = 'cyan';
var VALUE = undefined;
var ERROR = 'red';
var FALLBACK = 'yellow';

function color(str, col) {
  if (program.color && col && str) {
    return str[col];
  }
  return str;
}

function logError(err) {
  var error = {};
  var message  = ': ' + err.message.replace('\n', '');
  var name = err.name + (err.entry ? ' in ' + err.entry : '');
  console.warn(color(name + message, ERROR));
}

function singleline(str) {
  return str && str.replace(/\n/g, ' ')
                   .replace(/\s{3,}/g, ' ')
                   .trim();
}

function getString(entity) {
  return color(singleline(entity.toString(data)), VALUE);
}

function print(id, entity) {
  // print the string value of the entity
  console.log(color(id, ID), getString(entity));
  // print the string values of the attributes
  for (var attr in entity.attributes) {
    if (entity.attributes[attr].local && !program.withLocal) {
      continue;
    }
    console.log(color(' ::' + attr, ID), getString(entity.attributes[attr]));
  }
}

function compileAndPrint(err, code) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }
  if (program.ast) {
    var ast = code.toString();
  } else {
    var ast = parser.parse(code.toString());
  }

  var env = compile(ast);
  env.__plural = getPluralRule('en-US');
  for (var id in env) {
    if (id.indexOf('__') === 0) {
      continue;
    }
    print(id, env[id]);
  }
}

if (program.args.length) {
  fs.readFile(program.args[0], compileAndPrint);
} else {
  process.stdin.resume();
  process.stdin.on('data', compileAndPrint.bind(null, null));
}
