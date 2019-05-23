"use strict";

import assert from "assert";
import ftl from "../src/index";

suite("interpolation", function() {
  test("single", function() {
    assert.equal(
      ftl`
        foo ${"bar"}
        `,
      "foo bar"
    );
  });

  test("multiple", function() {
    assert.equal(
      ftl`
        foo ${"bar"}${"baz"}
        `,
      "foo barbaz"
    );
  });

  test("on separate lines", function() {
    assert.equal(
      ftl`
        ${"foo"}
          ${"bar"}
        ${"baz"}
        `,
      "foo\n  bar\nbaz"
    );
  });
});
