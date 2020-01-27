"use strict";

import assert from "assert";
import ftl from "../esm/index";

suite("tab indent", function() {
  test("same amount", function() {
    assert.strictEqual(
      ftl`
\t\tfoo
\t\t`,
      "foo"
    );
  });

  test("larger than common", function() {
    assert.strictEqual(
      ftl`
\t\t\tfoo
\t\t`,
      "\tfoo"
    );
  });

  test("smaller than common", function() {
    assert.throws(
      () => ftl`
\tfoo
\t\t`,
      /Insufficient indentation in line 1/
    );
  });

  test("2 tabs vs. 8 spaces", function() {
    assert.throws(
      () => ftl`
\t\tfoo
        `,
      /Insufficient indentation in line 1/
    );
  });

  test("8 spaces vs. 2 tabs", function() {
    assert.throws(
      () => ftl`
        foo
\t\t`,
      /Insufficient indentation in line 1/
    );
  });

  test("2 tabs vs. 2 spaces", function() {
    assert.throws(
      () => ftl`
\t\tfoo
  `,
      /Insufficient indentation in line 1/
    );
  });

  test("2 spaces vs. 2 tabs", function() {
    assert.throws(
      () => ftl`
  foo
\t\t`,
      /Insufficient indentation in line 1/
    );
  });
});
