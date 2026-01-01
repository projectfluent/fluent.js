import assert from "assert";
import ftl from "@fluent/dedent";

import { FluentBundle } from "../esm/bundle.js";
import { FluentResource } from "../esm/resource.js";

suite("Formatting values", function () {
  let bundle, args, errs;

  suiteSetup(function () {
    bundle = new FluentBundle("en-US", { useIsolating: false });
    bundle.addResource(
      new FluentResource(ftl`
      key1 = Value 1
      key2 = { $sel ->
          [a] A2
         *[b] B2
      }
      key3 = Value { 3 }
      key4 = { $sel ->
          [a] A{ 4 }
         *[b] B{ 4 }
      }
      key5 =
          .a = A5
          .b = B5
      `)
    );
  });

  setup(function () {
    errs = [];
  });

  test("returns the value", function () {
    const msg = bundle.getMessage("key1");
    const val = bundle.formatPattern(msg.value, args, errs);
    assert.strictEqual(val, "Value 1");
    assert.strictEqual(errs.length, 0);
  });

  test("returns the default variant", function () {
    const msg = bundle.getMessage("key2");
    const val = bundle.formatPattern(msg.value, args, errs);
    assert.strictEqual(val, "B2");
    assert.strictEqual(errs.length, 1);
  });

  test("returns the value if it is a pattern", function () {
    const msg = bundle.getMessage("key3");
    const val = bundle.formatPattern(msg.value, args, errs);
    assert.strictEqual(val, "Value 3");
    assert.strictEqual(errs.length, 0);
  });

  test("returns the default variant if it is a pattern", function () {
    const msg = bundle.getMessage("key4");
    const val = bundle.formatPattern(msg.value, args, errs);
    assert.strictEqual(val, "B4");
    assert.strictEqual(errs.length, 1);
  });

  test("returns {???} when trying to format a null value", function () {
    const msg = bundle.getMessage("key5");
    const val = bundle.formatPattern(msg.value, args, errs);
    assert.strictEqual(val, "{???}");
    assert.strictEqual(errs.length, 1);
  });

  test("allows to pass traits directly to bundle.formatPattern", function () {
    const msg = bundle.getMessage("key5");
    assert.strictEqual(
      bundle.formatPattern(msg.attributes.a, args, errs),
      "A5"
    );
    assert.strictEqual(
      bundle.formatPattern(msg.attributes.b, args, errs),
      "B5"
    );
    assert.strictEqual(errs.length, 0);
  });
});
