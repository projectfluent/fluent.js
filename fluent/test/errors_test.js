"use strict";

import assert from "assert";
import ftl from "@fluent/dedent";

import FluentBundle from "../src/bundle";

suite("Errors", function() {
  let bundle, errs;
  setup(function() {
    errs = [];
  });

  suite("Reporting into an array", function(){
    suiteSetup(function() {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addMessages(ftl`
        foo = {$one} and {$two}
        `);
    });

    test("Two errors are reported", function() {
      let msg = bundle.getMessage("foo");
      let val = bundle.formatPattern(msg.value, {}, errs);
      assert.strictEqual(val, "{$one} and {$two}");
      assert.strictEqual(errs.length, 2);
      assert.ok(errs[0] instanceof ReferenceError);
      assert.ok(errs[1] instanceof ReferenceError);
    });

    test("Two calls", function() {
      let msg = bundle.getMessage("foo");
      let val;

      val = bundle.formatPattern(msg.value, {}, errs);
      assert.strictEqual(val, "{$one} and {$two}");
      assert.strictEqual(errs.length, 2);
      assert.ok(errs[0] instanceof ReferenceError);
      assert.ok(errs[1] instanceof ReferenceError);

      val = bundle.formatPattern(msg.value, {}, errs);
      assert.strictEqual(val, "{$one} and {$two}");
      assert.strictEqual(errs.length, 4);
      assert.ok(errs[0] instanceof ReferenceError);
      assert.ok(errs[1] instanceof ReferenceError);
      assert.ok(errs[2] instanceof ReferenceError);
      assert.ok(errs[3] instanceof ReferenceError);
    });

    test("Non-empty errors array", function() {
      errs = ["Something"];
      let msg = bundle.getMessage("foo");
      let val = bundle.formatPattern(msg.value, {}, errs);

      assert.strictEqual(val, "{$one} and {$two}");
      assert.strictEqual(errs.length, 3);
      assert.strictEqual(errs[0], "Something");
      assert.ok(errs[1] instanceof ReferenceError);
      assert.ok(errs[2] instanceof ReferenceError);
    });
  });

  suite("Throwing", function(){
    suiteSetup(function() {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addMessages(ftl`
        foo = {$one} and {$two}
        `);
    });

    test("First error is thrown", function() {
      let msg = bundle.getMessage("foo");
      assert.throws(
        () => bundle.formatPattern(msg.value, {}),
        ReferenceError,
        "Unknown variable: $one"
      );
    });

    test("Two calls", function() {
      let msg = bundle.getMessage("foo");

      assert.throws(
        () => bundle.formatPattern(msg.value, {}),
        ReferenceError,
        "Unknown variable: $one"
      );

      assert.throws(
        () => bundle.formatPattern(msg.value, {}),
        ReferenceError,
        "Unknown variable: $one"
      );
    });
  });
});
