#!/usr/bin/env node

var fs = require('fs');
var exec = require('child_process').exec;

var colors = require('colors');
var program = require('commander');
var prettyjson = require('prettyjson');

var util = require('./util');

program
  .version('0.0.1')
  .usage('[options] command')
  .option('-s, --sample <int>', 'Sample size [150]', 50)
  .option('-p, --progress', 'Show progress')
  .option('-n, --no-color', 'Print without color')
  .option('-r, --raw', 'Print raw JSON')
  .option('-c, --compare <reference>', 'Compare with a reference JSON')
  .option('-a, --alpha <float>', 'Significance level for the t-test [0.01]', 
          0.01)
  .parse(process.argv);

if (program.args.length) {
  var command = program.args.join(' ');
} else {
  var command = "node benchmark.node.js";
}

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

function runAll(sample, callback) {
  var results = {};
  var times = {};
  // run is recursive and thus sequential so that node doesn't spawn all the 
  // processes at once
  run();
  function run() {
    exec(command, { cwd: __dirname }, function (error, stdout, stderr) {
      if (!program.raw && program.progress) {
        process.stdout.write(color('.', INDICATOR));
      }
      if (error) {
        console.log(error.toString());
      }
      var data = JSON.parse(stdout);
      for (var scenario in data) {
        if (!times[scenario]) {
          times[scenario] = [];
        }
        times[scenario].push(data[scenario]);
      }
      if (times[scenario].length !== sample) {
        run();
      } else {
        for (scenario in times) {
          var mean = util.mean(times[scenario]);
          results[scenario] = {
            mean: mean,
            stdev: util.stdev(times[scenario], mean),
            sample: sample
          };
        }
        callback(results);
      }
    });
  }
}

runAll(parseInt(program.sample), function(res) {

  for (var scenario in res) {
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

  if (!program.raw && program.progress) {
    process.stdout.write('\n');
  }

  if (program.raw) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    console.log(prettyjson.render(res, {
      keysColor: 'cyan',
      dashColor: 'cyan',
    }));
  }
});
