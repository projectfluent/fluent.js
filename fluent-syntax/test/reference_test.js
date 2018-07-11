import assert from "assert";
import {join} from "path";
import {readdir} from "fs";
import {readfile} from "./util";
import {FluentParser} from "../src";

const fixtures = join(__dirname, "fixtures_reference");

readdir(fixtures, function(err, filenames) {
  if (err) {
    throw err;
  }

  const ftlnames = filenames.filter(
    filename => filename.endsWith(".ftl")
  );

  // XXX This suite is not ideal. We ignore Junk and skip a number of fixtures.
  suite("Reference tests", function() {
    const parser = new FluentParser({withSpans: false});

    // The following fixtures produce different ASTs in the tooling parser than
    // in the reference parser. Skip them for now.
    const skips = [
      // Call arguments edge-cases.
      "call_expressions.ftl",

      // isPeekNextLineComment gives a false positive when the next line doesn't
      // start with # but is indented by at least (n + 1) spaces, where n is the
      // current comment level.
      "mixed_entries.ftl",

      // The tooling parser rejects variant keys which contain leading whitespace.
      // There's even a behavior fixture for this; it must have been a
      // deliberate decision.
      "select_expressions.ftl",

      // Broken Attributes break the entire Entry right now.
      // https://github.com/projectfluent/fluent.js/issues/237
      "leading_dots.ftl",
      "variant_lists.ftl"
    ];

    for (const filename of ftlnames) {

      // Skip the known AST incompatibilities.
      if (skips.includes(filename)) {
        test.skip(filename);
        continue;
      }

      const ftlpath = join(fixtures, filename);
      const astpath = ftlpath.replace(/ftl$/, "json");

      test(filename, async function() {
        const [ftl, expected] = await Promise.all(
          [ftlpath, astpath].map(readfile));

        const ref = JSON.parse(expected)
        const ast = parser.parse(ftl);

        // Ignore Junk which is parsed differently by the tooling parser, and
        // which doesn't carry spans nor annotations in the reference parser.
        ref.body = ref.body.filter(entry => entry.type !== "Junk");
        ast.body = ast.body.filter(entry => entry.type !== "Junk");

        assert.deepEqual(
          ast, ref,
          "Parsed AST doesn\'t match the expected one");
      });
    }
  });
});
