
function runTests(env) {
  const testData = JSON.parse(env.readFile("./fixtures/benchmarks.json"));

  const results = {};

  for (let testName in testData) {
    let test = testData[testName];
    runTest(env, testName, test.args, test.functions, results);
  }

  return results;
}

function runTest(env, name, args, fncs, results) {
  const ftlCode = env.readFile(`./fixtures/${name}.ftl`);

  {
    const testName = "parse-syntax";
    let start = env.now();
    const ast = env.FluentSyntax.parse(ftlCode);
    let end = env.now();

    if (ast.body.some(elem => elem.type == "Junk")) {
      throw Error("Junk in syntax parser result!");
    }

    results[`${testName}/"${name}"`] = env.ms(end) - env.ms(start);
  }

  let resource;
  {
    const testName = "parse-runtime";
    let start = env.now();
    resource = env.Fluent.FluentResource.fromString(ftlCode);
    let end = env.now();

    // we don't report any runtime parser errors, so
    // we'll rely on the syntax parser to verify that
    // the sample test syntax is correct.

    results[`${testName}/"${name}"`] = env.ms(end) - env.ms(start);
  }

  {
    const testName = "resolve-runtime";
    const functions = {};
    for (let fnName in fncs) {
      let body = fncs[fnName];
      functions[fnName] = new Function(body);
    }
    const bundle = new env.Fluent.FluentBundle('en-US', {
      functions
    });
    const errors = bundle.addResource(resource);

    let start = env.now();
    for (const [id, message] of bundle.messages) {
      bundle.format(message, args, errors);
      if (message.attrs) {
        for (const attrName in message.attrs) {
          bundle.format(message.attrs[attrName], args, errors)
        }
      }
    }
    let end = env.now();

    if (errors.length > 0) {
      throw new Error(`Errors accumulated while resolving ${name}.`);
    }

    results[`${testName}/"${name}"`] = env.ms(end) - env.ms(start);
  }
}

if (typeof exports !== "undefined") {
  exports.runTest = runTest;
  exports.runTests = runTests;
}
