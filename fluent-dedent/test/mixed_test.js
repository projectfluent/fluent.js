"use strict";

import assert from "assert";
import ftl from "../src/index";

suite("mixed indent", function() {
  test("same amount", function() {
    assert.equal(
      ftl`
\t    foo
\t    `,
      "foo"
    );
  });

  test("larger than common", function() {
    assert.equal(
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
      /Insufficient indentation in line 0/
    );
  });
});
