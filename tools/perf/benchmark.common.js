function runTest(env) {
  const results = {};
  const testData = JSON.parse(env.readFile("./fixtures/benchmarks.json"));
  const {args, functions} = testData[env.benchmarkName];
  const ftlCode = env.readFile(`./fixtures/${env.benchmarkName}.ftl`);

  {
    const testName = "parse-syntax";
    let start = env.now();
    const ast = env.FluentSyntax.parse(ftlCode);
    let end = env.now();

    if (ast.body.some(elem => elem.type == "Junk")) {
      throw Error("Junk in syntax parser result!");
    }

    results[`${testName}/${env.benchmarkName}`] = env.ms(end) - env.ms(start);
  }

  let resource;
  {
    const testName = "parse-runtime";
    let start = env.now();
    resource = new env.Fluent.FluentResource(ftlCode);
    let end = env.now();

    // we don't report any runtime parser errors, so
    // we'll rely on the syntax parser to verify that
    // the sample test syntax is correct.

    results[`${testName}/${env.benchmarkName}`] = env.ms(end) - env.ms(start);
  }

  let bundle;
  {
    const testName = "create-runtime";
    const fncs = {};
    for (let fnName in functions) {
      let body = functions[fnName];
      fncs[fnName] = new Function(body);
    }

    let start = env.now();
    bundle = new env.Fluent.FluentBundle('en-US', {
      functions: fncs
    });
    const errors = bundle.addResource(resource);
    let end = env.now();

    if (errors.length > 0) {
      throw new Error(
        `Errors accumulated while creating ${env.benchmarkName}.`);
    }

    results[`${testName}/${env.benchmarkName}`] = env.ms(end) - env.ms(start);
  }

  {
    const testName = "resolve-runtime";
    const errors = [];
    let start = env.now();
    for (const id of bundle._messages.keys()) {
      let message = bundle.getMessage(id);
      if (message.value) {
          bundle.formatPattern(message.value, args, errors);
      }
      for (const attrName in message.attributes) {
        bundle.formatPattern(message.attributes[attrName], args, errors)
      }
    }
    let end = env.now();

    if (errors.length > 0) {
      throw new Error(`Errors accumulated while resolving ${name}.`);
    }

    results[`${testName}/${env.benchmarkName}`] = env.ms(end) - env.ms(start);
  }

  return results;
}

if (typeof exports !== "undefined") {
  exports.runTest = runTest;
}
