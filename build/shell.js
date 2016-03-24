'use strict';

var grunt = require('grunt');

var reference = 'tools/perf/reference.json';
var samplesize = 50;

var engine = grunt.option('engine') || 'node';
var benchmark;

switch(engine) {
  case 'jsshell':
    benchmark = 'js benchmark.jsshell.js';
    break;
  case 'd8':
    benchmark = 'd8 benchmark.d8.js';
    break;
  case 'node':
    benchmark = 'node benchmark.node.js';
    break;
  default:
    grunt.fatal('Unknown engine: ' + grunt.option('engine'));
}

var perfCommand;

if (grunt.file.exists(reference)) {
  perfCommand = 'node ./tools/perf/run ' + benchmark + ' \
        --sample ' + samplesize + ' \
        --compare ' + reference;
} else {
  perfCommand = 'node ./tools/perf/run ' + benchmark + ' \
        --sample ' + samplesize;
}

module.exports = {
  reference: {
    options: {
      stdout: true,
    },
    command: 'node ./tools/perf/run ' + benchmark + ' \
        --sample ' + samplesize + ' \
        --raw > ' + reference + '; \
        cat ' + reference,
  },

  perf: {
    options: {
      stdout: true,
    },
    command: perfCommand,
  },
};
