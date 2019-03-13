function runTest(env) {
  const results = {};
  const testData = JSON.parse(env.readFile("./fixtures/benchmarks.json"));
  const {args, functions} = testData[env.sampleName];
  const ftlCode = env.readFile(`./fixtures/${env.sampleName}.ftl`);

  {
    const testName = "parse-syntax";
    let start = env.now();
    const ast = env.FluentSyntax.parse(ftlCode);
    let end = env.now();

    if (ast.body.some(elem => elem.type == "Junk")) {
      throw Error("Junk in syntax parser result!");
    }

    results[`${testName}/"${env.sampleName}"`] = env.ms(end) - env.ms(start);
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

    results[`${testName}/"${env.sampleName}"`] = env.ms(end) - env.ms(start);
  }

  {
    const testName = "resolve-runtime";
    const fncs = {};
    for (let fnName in functions) {
      let body = functions[fnName];
      fncs[fnName] = new Function(body);
    }
    const bundle = new env.Fluent.FluentBundle('en-US', {
      functions: fncs
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

    results[`${testName}/"${env.sampleName}"`] = env.ms(end) - env.ms(start);
  }

  return results;
}

if (typeof exports !== "undefined") {
  exports.runTest = runTest;
}
