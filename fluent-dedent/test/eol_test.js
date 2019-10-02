"use strict";

import assert from "assert";
import ftl from "../src/index";

suite("EOL at extremes", function () {
  test("no EOLs", function () {
    assert.throws(
      () => ftl`foo`,
      /Content must start on a new line/
    );
  });

  test("EOL at the beginning", function () {
    assert.throws(
      () => ftl`
      foo`,
      /Closing delimiter must appear on a new line/
    );
  });

  test("EOL at the end", function () {
    assert.throws(
      () => ftl`foo
`,
      /Content must start on a new line/
    );
  });

  test("two EOLs", function () {
    assert.strictEqual(
      ftl`
      foo
      `,
      "foo"
    );
  });
});
