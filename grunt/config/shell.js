'use strict';

var grunt = require('grunt');

var reference = 'tools/perf/reference.json';
var samplesize = 150;

var benchmark;

if (process.env.BENCHMARK) {
  benchmark = process.env.BENCHMARK;
} else if (process.env.JSSHELL) {
  benchmark = process.env.JSSHELL + ' benchmark.jsshell.js';
} else {
  benchmark = 'node benchmark.node.js';
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
  'gh-pages': {
    options: {
      stdout: true,
    },
    command: './build/gh-pages.sh',
  },

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
