"use strict";

import assert from "assert";
import ftl from "../esm/index.js";

suite("mixed indent", function() {
  test("same amount", function() {
    assert.strictEqual(
      ftl`
\t    foo
\t    `,
      "foo"
    );
  });

  test("larger than common", function() {
    assert.strictEqual(
      ftl`
\t        foo
\t    `,
      "    foo"
    );
  });

  test("smaller than common", function() {
    assert.throws(
      () => ftl`
\tfoo
\t    `,
      /Insufficient indentation in line 1/
    );
  });
});
