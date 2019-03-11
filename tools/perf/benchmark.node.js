const fs = require('fs');

const Fluent = require('../../fluent');
const FluentSyntax = require('../../fluent-syntax');
const { runTest, runTests } = require('./benchmark.common');

const env = {
  readFile: (path) => {
    return fs.readFileSync(`${__dirname}/${path}`).toString();
  },
	ms: ([seconds, nanoseconds]) => {
		return Math.round((seconds * 1e9 + nanoseconds) / 1e3) / 1e3;
	},
  now: process.hrtime,
  FluentSyntax,
  Fluent,
};

const results = runTests(env);

console.log(JSON.stringify(results));
