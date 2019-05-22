"use strict";

import assert from "assert";
import ftl from "../src/index";

suite("blank lines", function() {
  test("leading", function() {
    assert.equal(
      ftl`

        foo
        `,
      "\nfoo"
    );
  });

  test("middle", function() {
    assert.equal(
      ftl`
        foo

        bar
        `,
      "foo\n\nbar"
    );
  });

  test("trailing", function() {
    assert.equal(
      ftl`
        foo

        `,
      "foo\n"
    );
  });
});
