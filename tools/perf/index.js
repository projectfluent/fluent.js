#!/usr/bin/env node

var fs = require('fs');
var colors = require('colors');
var program = require('commander');
var prettyjson = require('prettyjson');

var util = require('./util');
var Parser = require('../../lib/l20n/parser').Parser;
var Compiler = require('../../lib/l20n/compiler').Compiler;
var RetranslationManager = require('../../lib/l20n/retranslation').RetranslationManager;
require('../../lib/l20n/platform/globals');

program
  .version('0.0.1')
  .usage('[options]')
  .option('-s, --sample <int>', 'Sample size [25]', 25)
  .option('-i, --iterations <int>', 'Iterations per sample [100]', 100)
  .option('-p, --progress', 'Show progress')
  .option('-r, --raw', 'Print raw JSON')
  .parse(process.argv);

var parser = new Parser(true); 
var compiler = new Compiler();
var retr = new RetranslationManager();

compiler.setGlobals(retr.globals);

var code = fs.readFileSync(__dirname + '/example.lol').toString();
var data = {
  "ssid": "SSID",
  "device": "DEVICE",
  "pin": "PIN",
  "capabilities": "CAPABILITIES",
  "linkSpeed": "LINKSPEED",
  "code": "CODE",
  "app": "APP",
  "size": "SIZE",
  "unit": "UNIT",
  "list": "LIST",
  "level": "LEVEL",
  "number": "NUMBER",
  "link1": "LINK1",
  "link2": "LINK2"
}
var ast = parser.parse(code);
var env = compiler.compile(ast);

function parse() {
  parser.parse(code);
}

function compile() {
  compiler.compile(ast);
}

function get() {
  for (var id in env) {
    if (env[id]._resolve) {
      env[id].get(data)
    }
  }
}

function print(str) {
  if (program.progress) {
    process.stdout.write(str.cyan);
  }
}

function run(fn, sample, iterations) {
  var times = [];
  for (var j = 0; j < sample; j++) {
    var start = +Date.now();
    for (var i = 0; i < iterations; i++) {
      fn();
    }
    var stop = +Date.now();
    var time = stop - start;
    times.push(time);
    print('.');
  }

  var mean = util.mean(times);
  return {
    mean: mean,
    stdev: parseInt(util.stdev(times, mean))
  }
}

var res = {}
res.parsing = run(parse, program.sample, program.iterations);
res.compilation = run(compile, program.sample, program.iterations);
res.get = run(get, program.sample, program.iterations);

print('\n');

if (program.raw) {
  console.log(JSON.stringify(res, null, 2));
} else {
  console.log(prettyjson.render(res, {
    keysColor: 'cyan',
    dashColor: 'cyan',
  }));
}
