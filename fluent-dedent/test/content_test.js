"use strict";

import assert from "assert";
import ftl from "../esm/index";

suite("content lines", function() {
  test("no indent", function () {
    assert.strictEqual(
      ftl`
foo
bar
`,
      "foo\nbar"
    );
  });

  test("zero indent", function () {
    assert.strictEqual(
      ftl`
        foo
    bar
`,
      "        foo\n    bar"
    );
  });

  test("small indent", function () {
    assert.strictEqual(
      ftl`
        foo
    bar
    `,
      "    foo\nbar"
    );
  });

  test("same indent", function () {
    assert.strictEqual(
      ftl`
        foo
        bar
        `,
      "foo\nbar"
    );
  });

  test("larger indent", function () {
    assert.throws(
      () => ftl`
          foo
        bar
          `,
      /Insufficient indentation in line 2/
    );
  });
});
