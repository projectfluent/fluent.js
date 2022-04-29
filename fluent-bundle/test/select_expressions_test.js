"use strict";
import assert from "assert";
import ftl from "@fluent/dedent";

import { FluentBundle } from "../esm/bundle.js";
import { FluentResource } from "../esm/resource.js";

suite("Select expressions", function () {
  let bundle, errs;

  setup(function () {
    bundle = new FluentBundle("en-US", { useIsolating: false });
    errs = [];
  });

  test("missing selector", function () {
    bundle.addResource(
      new FluentResource(ftl`
      select = {$none ->
          [a] A
         *[b] B
      }
      `)
    );
    const msg = bundle.getMessage("select");
    const val = bundle.formatPattern(msg.value, null, errs);
    assert.strictEqual(val, "B");
    assert.strictEqual(errs.length, 1);
    assert(errs[0] instanceof ReferenceError); // unknown variable
  });

  suite("string selectors", function () {
    test("matching selector", function () {
      bundle.addResource(
        new FluentResource(ftl`
        select = {$selector ->
            [a] A
           *[b] B
        }
        `)
      );
      const msg = bundle.getMessage("select");
      const val = bundle.formatPattern(msg.value, { selector: "a" }, errs);
      assert.strictEqual(val, "A");
      assert.strictEqual(errs.length, 0);
    });

    test("non-matching selector", function () {
      bundle.addResource(
        new FluentResource(ftl`
        select = {$selector ->
            [a] A
           *[b] B
        }
        `)
      );
      const msg = bundle.getMessage("select");
      const val = bundle.formatPattern(msg.value, { selector: "c" }, errs);
      assert.strictEqual(val, "B");
      assert.strictEqual(errs.length, 0);
    });
  });

  suite("number selectors", function () {
    test("matching selector", function () {
      bundle.addResource(
        new FluentResource(ftl`
        select = {$selector ->
            [0] A
           *[1] B
        }
        `)
      );
      const msg = bundle.getMessage("select");
      const val = bundle.formatPattern(msg.value, { selector: 0 }, errs);
      assert.strictEqual(val, "A");
      assert.strictEqual(errs.length, 0);
    });

    test("non-matching selector", function () {
      bundle.addResource(
        new FluentResource(ftl`
        select = {$selector ->
            [0] A
           *[1] B
        }
        `)
      );
      const msg = bundle.getMessage("select");
      const val = bundle.formatPattern(msg.value, { selector: 2 }, errs);
      assert.strictEqual(val, "B");
      assert.strictEqual(errs.length, 0);
    });
  });

  suite("plural categories", function () {
    test("matching number selector", function () {
      bundle.addResource(
        new FluentResource(ftl`
        select = {$selector ->
            [one] A
           *[other] B
        }
        `)
      );
      const msg = bundle.getMessage("select");
      const val = bundle.formatPattern(msg.value, { selector: 1 }, errs);
      assert.strictEqual(val, "A");
      assert.strictEqual(errs.length, 0);
    });

    test("matching string selector", function () {
      bundle.addResource(
        new FluentResource(ftl`
        select = {$selector ->
            [one] A
           *[other] B
        }
        `)
      );
      const msg = bundle.getMessage("select");
      const val = bundle.formatPattern(msg.value, { selector: "one" }, errs);
      assert.strictEqual(val, "A");
      assert.strictEqual(errs.length, 0);
    });

    test("non-matching number selector", function () {
      bundle.addResource(
        new FluentResource(ftl`
        select = {$selector ->
            [one] A
           *[default] D
        }
        `)
      );
      const msg = bundle.getMessage("select");
      const val = bundle.formatPattern(msg.value, { selector: 2 }, errs);
      assert.strictEqual(val, "D");
      assert.strictEqual(errs.length, 0);
    });

    test("non-matching string selector", function () {
      bundle.addResource(
        new FluentResource(ftl`
        select = {$selector ->
            [one] A
           *[default] D
        }
        `)
      );
      const msg = bundle.getMessage("select");
      const val = bundle.formatPattern(msg.value, { selector: "other" }, errs);
      assert.strictEqual(val, "D");
      assert.strictEqual(errs.length, 0);
    });
  });
});
