#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var colors = require('colors');

var Parser = require('../lib/l20n/parser').Parser;
var Compiler = require('../lib/l20n/compiler').Compiler;
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
var compiler = new Compiler();
parser.addEventListener('error', logError);
compiler.addEventListener('error', logError);

var data = {};
if (program.data) {
  data = JSON.parse(fs.readFileSync(program.data, 'utf8'));
}

var ID = 'cyan';
var VALUE = undefined;
var ERROR = 'red';
var FALLBACK = 'yellow';

function color(str, col) {
  if (program.color && col) {
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
  return str.replace(/\n/g, ' ')
            .replace(/\s{3,}/g, ' ')
            .trim();
}

function getString(entity) {
  try {
    return color(singleline(entity.getString(data)), VALUE);
  } catch (e) {
    if (!(e instanceof Compiler.Error)) {
      logError(e);
      return color('(' + e.name + ')', FALLBACK);
    }
    if (e.source) {
      return color(singleline(e.source), FALLBACK);
    } else {
      return color(entity.id, FALLBACK);
    }
  }
}

function print(entity) {
  if (entity.local && !program.withLocal) {
    return;
  }
  // print the string value of the entity
  console.log(color(entity.id, ID), getString(entity));
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

  ast.body['plural'] = {
    type: 'Macro',
    args: [{
      type: 'Identifier',
      name: 'n'
    }],
    expression: getPluralRule(program.plural)
  };

  var env = compiler.compile(ast);
  for (var id in env) {
    if (env[id].expression) {
      continue;
    }
    print(env[id]);
  }
}

if (program.args.length) {
  fs.readFile(program.args[0], compileAndPrint);
} else {
  process.stdin.resume();
  process.stdin.on('data', compileAndPrint.bind(null, null));
}
