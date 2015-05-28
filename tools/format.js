#!/usr/bin/env node

'use strict';

require('babel/register');

var fs = require('fs');
var program = require('commander');
var colors = require('colors');

var PropertiesParser =
  require('../src/lib/format/properties/parser');

var Resolver = require('../src/lib/resolver');
var extendEntries = require('../src/bindings/node').extendEntries;
var getPluralRule = require('../src/lib/plurals').getPluralRule;

program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-d, --data <file>', 'Context data to use (.json)')
  .option('-a, --ast', 'Treat input as AST, not source code')
  .option('-n, --no-color', 'Print without color')
  .option('-l, --with-local', 'Print local entities and attributes')
  .option('-p, --plural <locale>', 'Select the plural rule [en-US]', 'en-US')
  .parse(process.argv);


var data = {};
if (program.data) {
  data = JSON.parse(fs.readFileSync(program.data, 'utf8'));
}

var VALUE;
var ID = 'cyan';
var ERROR = 'red';

function color(str, col) {
  if (program.color && col && str) {
    return str[col];
  }
  return str;
}

function makeError(err) {
  var message  = ': ' + err.message.replace('\n', '');
  var name = err.name + (err.entry ? ' in ' + err.entry : '');
  return color(name + message, ERROR);
}

function singleline(formatted) {
  var str = formatted[1];
  return str && str.replace(/\n/g, ' ')
                   .replace(/\s{3,}/g, ' ')
                   .trim();
}

function format(entity) {
  try {
    return singleline(Resolver.format(data, entity));
  } catch(err) {
    return makeError(err);
  }
}

function print(id, entity) {
  // print the string value of the entity
  console.log(color(id, ID), color(format(entity), VALUE));
  // print the string values of the attributes
  for (var attr in entity.attrs) {
    console.log(color(' ::' + attr, ID),
                color(format(entity.attrs[attr]), VALUE));
  }
}

function compileAndPrint(err, code) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }

  var ast;
  if (program.ast) {
    ast = code.toString();
  } else {
    try {
      ast = PropertiesParser.parse(null, code.toString());
    } catch (e) {
      console.warn(makeError(e));
    }
  }

  var entries = {
  __plural: getPluralRule('en-US')
  };
  extendEntries(entries, ast);
  for (var id in entries) {
    if (id.indexOf('__') === 0) {
      continue;
    }
    print(id, entries[id]);
  }
}

if (program.args.length) {
  fs.readFile(program.args[0], compileAndPrint);
} else {
  process.stdin.resume();
  process.stdin.on('data', compileAndPrint.bind(null, null));
}
