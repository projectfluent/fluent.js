load("../../fluent-bundle/index.js");
load("../../fluent-syntax/index.js");
load("./benchmark.common.js");

const env = {
  readFile: path => {
    return read(path);
  },
  ms: milliseconds => {
    return milliseconds;
  },
  benchmarkName: scriptArgs[0],
  now: performance.now,
  FluentSyntax,
  FluentBundle,
};

const results = runTest(env);

print(JSON.stringify(results));
