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

  test("containing the same amount of spaces as the common indent", function() {
    assert.equal(
      ftl`
      
      `,
      ""
    );
  });

  test("containing too few spaces", function() {
    assert.throws(
      () => ftl`
  
      `,
      /Insufficient indentation in line 1/
    );
  });

  test("containing too many spaces", function() {
    assert.equal(
      ftl`
        
      `,
      "  "
    );
  });
});
