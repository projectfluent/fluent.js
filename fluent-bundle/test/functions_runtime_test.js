import assert from "assert";
import ftl from "@fluent/dedent";

import { FluentBundle } from "../esm/bundle.js";
import { FluentResource } from "../esm/resource.js";
import { FluentNumber } from "../esm/types.js";

suite("Runtime-specific functions", function () {
  let bundle, errs;

  setup(function () {
    errs = [];
  });

  suite("passing into the constructor", function () {
    suiteSetup(function () {
      bundle = new FluentBundle("en-US", {
        useIsolating: false,
        functions: {
          CONCAT: args => args.reduce((a, b) => `${a}${b}`, ""),
          SUM: args => new FluentNumber(args.reduce((a, b) => a + b, 0)),
          PLATFORM: () => "windows",
        },
      });
      bundle.addResource(
        new FluentResource(ftl`
        foo = { CONCAT("Foo", "Bar") }
        bar = { SUM(1, 2) }
        pref =
          { PLATFORM() ->
              [windows] Options
             *[other] Preferences
          }
        `)
      );
    });

    test("works for strings", function () {
      const msg = bundle.getMessage("foo");
      const val = bundle.formatPattern(msg.value, undefined, errs);
      assert.strictEqual(val, "FooBar");
      assert.strictEqual(errs.length, 0);
    });

    test("works for selectors", function () {
      const msg = bundle.getMessage("pref");
      const val = bundle.formatPattern(msg.value, undefined, errs);
      assert.strictEqual(val, "Options");
      assert.strictEqual(errs.length, 0);
    });

    test("works for numbers", function () {
      const msg = bundle.getMessage("bar");
      const val = bundle.formatPattern(msg.value, undefined, errs);
      assert.strictEqual(val, "3");
      assert.strictEqual(errs.length, 0);
    });
  });
});
