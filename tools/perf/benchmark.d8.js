load('../../fluent/index.js');
load('../../fluent-syntax/index.js');
load('./benchmark.common.js');

const env = {
  readFile: (path) => {
    return read(path);
  },
  ms: (milliseconds) => {
    return milliseconds;
  },
  benchmarkName: arguments[0],
  now: Date.now,
  FluentSyntax,
  FluentBundle,
};

const results = runTest(env);

print(JSON.stringify(results));
