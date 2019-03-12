load('../../fluent/fluent.js');
load('../../fluent-syntax/fluent-syntax.js');
load('./benchmark.common.js');

const env = {
  readFile: (path) => {
    return read(path);
  },
  ms: (milliseconds) => {
    return milliseconds;
  },
  now: performance.now,
  FluentSyntax,
  Fluent,
};

const results = runTests(env);

print(JSON.stringify(results));
