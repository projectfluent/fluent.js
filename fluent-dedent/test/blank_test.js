import assert from "assert";
import ftl from "../src/index.ts";

suite("blank lines", function () {
  test("leading", function () {
    assert.strictEqual(
      ftl`

        foo
        `,
      "\nfoo"
    );
  });

  test("middle", function () {
    assert.strictEqual(
      ftl`
        foo

        bar
        `,
      "foo\n\nbar"
    );
  });

  test("trailing", function () {
    assert.strictEqual(
      ftl`
        foo

        `,
      "foo\n"
    );
  });

  test("containing the same amount of spaces as the common indent", function () {
    assert.strictEqual(
      ftl`
      
      `,
      ""
    );
  });

  test("containing too few spaces", function () {
    assert.throws(
      () => ftl`
  
      `,
      /Insufficient indentation in line 1/
    );
  });

  test("containing too many spaces", function () {
    assert.strictEqual(
      ftl`
        
      `,
      "  "
    );
  });
});
