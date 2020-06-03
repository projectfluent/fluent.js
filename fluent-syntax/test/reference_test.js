import assert from "assert";
import {join} from "path";
import {readdir} from "fs";
import {readfile} from "./util";
import {FluentParser} from "../esm/parser.js";

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
      // Broken Attributes break the entire Entry right now.
      // https://github.com/projectfluent/fluent.js/issues/237
      "leading_dots.ftl",
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

        // Only compare Junk content and ignore annotations, which carry error
        // messages and positions. The reference parser doesn't produce
        // annotations at the moment.
        ast.body = ast.body.map(entry => entry.type === "Junk" ?
          {...entry, annotations: []} : entry);

        assert.deepEqual(
          ast, ref,
          "Parsed AST doesn't match the expected one");
      });
    }
  });
});
