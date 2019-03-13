const fs = require('fs');

const Fluent = require('../../fluent');
const FluentSyntax = require('../../fluent-syntax');
const { runTest } = require('./benchmark.common');
require('intl-pluralrules');

const env = {
  readFile: (path) => {
    return fs.readFileSync(`${__dirname}/${path}`).toString();
  },
  ms: ([seconds, nanoseconds]) => {
    return seconds * 1e3 + nanoseconds / 1e6;
  },
  sampleName: process.argv[2],
  now: process.hrtime,
  FluentSyntax,
  Fluent,
};

const results = runTest(env);

console.log(JSON.stringify(results));
