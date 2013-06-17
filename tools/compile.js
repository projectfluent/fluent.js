#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var colors = require('colors');

var Parser = require('../lib/l20n/parser').Parser;
var Compiler = require('../lib/l20n/compiler').Compiler;

program
  .version('0.0.1')
  .usage('[options] [file]')
  .option('-d, --data <file>', 'Context data to use (.json)')
  .option('-a, --ast', 'Treat input as AST, not source code')
  .option('-n, --no-color', 'Print without color')
  .parse(process.argv);

var parser = new Parser();
var compiler = new Compiler();
parser.addEventListener('error', logError);
compiler.addEventListener('error', logError);

var data = {};
if (program.data) {
  data = JSON.parse(fs.readFileSync(program.data, 'utf8'));
}

function color(str, col) {
  if (program.color) {
    return str[col];
  }
  return str;
}

function logError(err) {
  var error = {};
  var message  = ': ' + err.message.replace('\n', '');
  var name = err.name + (err.entry ? ' in ' + err.entry : '');
  console.warn(color(name, 'red') + message);
}

function singleline(str) {
  return str.replace(/\n/g, ' ')
            .replace(/\s{3,}/g, ' ')
            .trim();
}

function getString(entity) {
  try {
    return singleline(entity.getString(data));
  } catch (e) {
    if (!(e instanceof Compiler.Error)) {
      logError(e);
      return color('(' + e.name + ')', 'grey');
    }
    if (e.source) {
      return color(singleline(e.source), 'grey');
    } else {
      return color(entity.id, 'grey');
    }
  }
}

function print(err, code) {
  if (err) {
    return console.error('File not found: ' + err.path);
  }
  if (program.ast) {
    var ast = code.toString();
  } else {
    var ast = parser.parse(code.toString());
  }

  var env = compiler.compile(ast);
  var printable = {};
  for (var id in env) {
    if (env[id].expression) {
      continue;
    }
    console.log(color(id, 'cyan'), getString(env[id]));
  }
}

if (program.args.length) {
  fs.readFile(program.args[0], print);
} else {
  process.stdin.resume();
  process.stdin.on('data', print.bind(null, null));
}
