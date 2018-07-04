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

  suite.skip("Reference tests", function() {
    const parser = new FluentParser({withSpans: false});

    for (const filename of ftlnames) {
      const ftlpath = join(fixtures, filename);
      const astpath = ftlpath.replace(/ftl$/, "json");

      test(filename, async function() {
        const [ftl, expected] = await Promise.all(
          [ftlpath, astpath].map(readfile));

        const ref = JSON.parse(expected)
        const ast = parser.parse(ftl);

        ref.body = ref.body.filter(entry => entry.type !== "Junk");
        ast.body = ast.body.filter(entry => entry.type !== "Junk");

        assert.deepEqual(
          ast, ref,
          "Parsed AST doesn\'t match the expected one");
      });
    }
  });
});
