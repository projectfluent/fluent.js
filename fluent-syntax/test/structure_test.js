import assert from "assert";
import { join } from "path";
import { readdir } from "fs";
import { readfile } from "./util";

import { parse } from "../esm/index.js";

const fixtures = join(__dirname, "fixtures_structure");

readdir(fixtures, function(err, filenames) {
  if (err) {
    throw err;
  }

  const ftlnames = filenames.filter(
    filename => filename.endsWith(".ftl")
  );

  suite("Structure tests", function() {
    for (const filename of ftlnames) {
      const ftlpath = join(fixtures, filename);
      const astpath = ftlpath.replace(/ftl$/, "json");
      test(filename, function() {
        return Promise.all(
          [ftlpath, astpath].map(readfile)
        ).then(([ftl, expected]) => {
          const ast = parse(ftl);
          assert.deepEqual(
            ast, JSON.parse(expected),
            "Parsed AST doesn't match the expected one"
          );
        });
      });
    }
  });
});
