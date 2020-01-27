"use strict";

import assert from "assert";
import ftl from "../esm/index";

suite("interpolation", function() {
  test("single", function() {
    assert.strictEqual(
      ftl`
        foo ${"bar"}
        `,
      "foo bar"
    );
  });

  test("multiple", function() {
    assert.strictEqual(
      ftl`
        foo ${"bar"}${"baz"}
        `,
      "foo barbaz"
    );
  });

  test("on separate lines", function() {
    assert.strictEqual(
      ftl`
        ${"foo"}
          ${"bar"}
        ${"baz"}
        `,
      "foo\n  bar\nbaz"
    );
  });
});
