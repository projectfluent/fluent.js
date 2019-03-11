const fs = require('fs');

const Fluent = require('../../fluent');
const FluentSyntax = require('../../fluent-syntax');
const { runTest, runTests } = require('./benchmark.common');

const env = {
  readFile: (path) => {
    return fs.readFileSync(`${__dirname}/${path}`).toString();
  },
  ms: (nanoseconds) => {
    return Number(nanoseconds / 1000000n);
  },
  now: process.hrtime.bigint,
  FluentSyntax,
  Fluent,
};

const results = runTests(env);

console.log(JSON.stringify(results));
