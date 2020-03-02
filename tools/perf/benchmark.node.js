const fs = require('fs');

const FluentBundle = require('../../fluent-bundle/index.js');
const FluentSyntax = require('../../fluent-syntax/index.js');
const { runTest } = require('./benchmark.common');
require('intl-pluralrules');

const env = {
  readFile: (path) => {
    return fs.readFileSync(`${__dirname}/${path}`).toString();
  },
  ms: ([seconds, nanoseconds]) => {
    return seconds * 1e3 + nanoseconds / 1e6;
  },
  benchmarkName: process.argv[2],
  now: process.hrtime,
  FluentSyntax,
  FluentBundle,
};

const results = runTest(env);

console.log(JSON.stringify(results));
