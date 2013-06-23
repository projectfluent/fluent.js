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
  .option('-s, --sample <int>', 'Sample size [500]', 500)
  .option('-p, --progress', 'Show progress')
  .option('-n, --no-color', 'Print without color')
  .option('-r, --raw', 'Print raw JSON')
  .option('-c, --compare <reference>', 'Compare with a reference JSON')
  .option('-a, --alpha <float>', 'Significance level for the t-test [0.01]', 
          0.01)
  .parse(process.argv);

var parser = new Parser(); 
var compiler = new Compiler();
var retr = new RetranslationManager();

parser.addEventListener('error', logError);
compiler.addEventListener('error', logError);
compiler.setGlobals(retr.globals);

var GOOD = 'green';
var BAD = 'red';
var INDICATOR = 'cyan';
var ERROR = 'red';

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
  console.warn(color(name, ERROR) + color(message, ERROR));
}

var code = fs.readFileSync(__dirname + '/example.lol').toString();
var data = {
  "ssid": "SSID",
  "capabilities": "CAPABILITIES",
  "linkSpeed": "LINKSPEED",
  "pin": "PIN",
  "n": 3,
  "name": "NAME",
  "device": "DEVICE",
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

var scenarios = {
  parse: function parse() {
    parser.parse(code);
  },
  compile: function compile() {
    compiler.compile(ast);
  },
  get: function get() {
    for (var id in env) {
      if (env[id]._resolve) {
        env[id].get(data)
      }
    }
  }
}

function print(str) {
  if (program.progress) {
    process.stdout.write(color(str, INDICATOR));
  }
}

function getMicroSeconds(time) {
  // time is [seconds, nanoseconds]
  var micro = (time[0] * 1e9 + time[1]) / 1000;
  return +micro.toFixed(2);
}

function run(fn, sample) {
  var times = [];
  for (var j = 0; j < sample; j++) {
    var start = process.hrtime();
    fn();
    var time = process.hrtime(start);
    times.push(getMicroSeconds(time));
    print('.');
  }
  var mean = util.mean(times);
  return {
    mean: mean,
    stdev: util.stdev(times, mean),
    sample: +sample
  };
}

var res = {}
for (var scenario in scenarios) {
  res[scenario] = run(scenarios[scenario], program.sample);
  if (program.compare) {
    var ref = JSON.parse(fs.readFileSync(program.compare).toString());
    var delta = +(res[scenario].mean - ref[scenario].mean).toFixed(2);
    var sig = !util.meansEqual(ref[scenario], res[scenario], 1 - program.alpha);
    var relative = +(delta / ref[scenario].mean).toFixed(2)
    if (program.raw) {
      res[scenario].significant = sig;
      res[scenario].delta = delta;
      res[scenario].relative = relative;
    } else {
      var percent = (delta > 0 ? '+' : '') + relative * 100 + '%';
      if (!sig) {
        res[scenario].mean += ' (' + percent + ')';
      } else if (delta > 0) {
        res[scenario].mean += color(' (' + percent + ')', BAD);
      } else {
        res[scenario].mean += color(' (' + percent + ')', GOOD);
      }
    }
  }
}

print('\n');

if (program.raw) {
  console.log(JSON.stringify(res, null, 2));
} else {
  console.log(prettyjson.render(res, {
    keysColor: 'cyan',
    dashColor: 'cyan',
  }));
}
