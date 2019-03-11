load('../../fluent/fluent.js');
load('../../fluent-syntax/fluent-syntax.js');
load('./benchmark.common.js');

const env = {
  readFile: (path) => {
    return read(path);
  },
  ms: (nanoseconds) => {
    return Math.round(nanoseconds * 1e3) / 1e3;
  },
  now: performance.now,
  FluentSyntax,
  Fluent,
};

const results = runTests(env);

print(JSON.stringify(results));
