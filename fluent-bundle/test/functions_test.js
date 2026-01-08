import assert from "assert";
import ftl from "@fluent/dedent";

import { FluentBundle } from "../src/bundle.ts";
import { FluentResource } from "../src/resource.ts";

suite("Functions", function () {
  let bundle, errs;

  beforeEach(function () {
    errs = [];
  });

  suite("missing", function () {
    beforeAll(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        foo = { MISSING("Foo") }
        `)
      );
    });

    test("falls back to the name of the function", function () {
      const msg = bundle.getMessage("foo");
      const val = bundle.formatPattern(msg.value, undefined, errs);
      assert.strictEqual(val, "{MISSING()}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown function
    });
  });

  suite("arguments", function () {
    beforeAll(function () {
      bundle = new FluentBundle("en-US", {
        useIsolating: false,
        functions: {
          IDENTITY: args => args[0],
        },
      });
      bundle.addResource(
        new FluentResource(ftl`
        foo = Foo
            .attr = Attribute
        pass-nothing       = { IDENTITY() }
        pass-string        = { IDENTITY("a") }
        pass-number        = { IDENTITY(1) }
        pass-message       = { IDENTITY(foo) }
        pass-attr          = { IDENTITY(foo.attr) }
        pass-variable      = { IDENTITY($var) }
        pass-function-call = { IDENTITY(IDENTITY(1)) }
        `)
      );
    });

    // XXX Gracefully handle wrong argument types passed into FTL Functions
    // https://bugzil.la/1307124
    test.skip("falls back when arguments don't match the arity", function () {
      const msg = bundle.getMessage("pass-nothing");
      const val = bundle.formatPattern(msg.value, undefined, errs);
      assert.strictEqual(val, "IDENTITY()");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof RangeError); // wrong argument type
    });

    test("accepts strings", function () {
      const msg = bundle.getMessage("pass-string");
      const val = bundle.formatPattern(msg.value, undefined, errs);
      assert.strictEqual(val, "a");
      assert.strictEqual(errs.length, 0);
    });

    test("accepts numbers", function () {
      const msg = bundle.getMessage("pass-number");
      const val = bundle.formatPattern(msg.value, undefined, errs);
      assert.strictEqual(val, "1");
      assert.strictEqual(errs.length, 0);
    });

    test("accepts entities", function () {
      const msg = bundle.getMessage("pass-message");
      const val = bundle.formatPattern(msg.value, undefined, errs);
      assert.strictEqual(val, "Foo");
      assert.strictEqual(errs.length, 0);
    });

    // XXX Accept complex types (e.g. attributes) as arguments to FTL Functions
    // https://bugzil.la/1307120
    test.skip("accepts attributes", function () {
      const msg = bundle.getMessage("pass-attr");
      const val = bundle.formatPattern(msg.value, undefined, errs);
      assert.strictEqual(val, "Attribute");
      assert.strictEqual(errs.length, 0);
    });

    test("accepts variables", function () {
      const msg = bundle.getMessage("pass-variable");
      const val = bundle.formatPattern(msg.value, { var: "Variable" }, errs);
      assert.strictEqual(val, "Variable");
      assert.strictEqual(errs.length, 0);
    });

    test("accepts function calls", function () {
      const msg = bundle.getMessage("pass-function-call");
      const val = bundle.formatPattern(msg.value, undefined, errs);
      assert.strictEqual(val, "1");
      assert.strictEqual(errs.length, 0);
    });
  });
});
