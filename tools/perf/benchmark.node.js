const fs = require('fs');

const Fluent = require('../../fluent');
const FluentSyntax = require('../../fluent-syntax');
const { runTest, runTests } = require('./benchmark.common');

const env = {
  readFile: (path) => {
    return fs.readFileSync(`${__dirname}/${path}`).toString();
  },
  ms: ([seconds, nanoseconds]) => {
    return seconds * 1e3 + nanoseconds / 1e6;
  },
  now: process.hrtime,
  FluentSyntax,
  Fluent,
};

const results = runTests(env);

console.log(JSON.stringify(results));
