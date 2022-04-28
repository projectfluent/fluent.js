"use strict";

import assert from "assert";
import ftl from "@fluent/dedent";

import { FluentBundle } from "../esm/bundle.js";
import { FluentResource } from "../esm/resource.js";

suite("Primitives", function () {
  let bundle, args, errs;

  setup(function () {
    errs = [];
  });

  suite("Numbers", function () {
    suiteSetup(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        one     = { 1 }
        select  = { 1 ->
           *[0] Zero
            [1] One
        }
        `)
      );
    });

    test("can be used in a placeable", function () {
      const msg = bundle.getMessage("one");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "1");
      assert.strictEqual(errs.length, 0);
    });

    test("can be used as a selector", function () {
      const msg = bundle.getMessage("select");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "One");
      assert.strictEqual(errs.length, 0);
    });
  });

  suite("Simple string value", function () {
    suiteSetup(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        foo               = Foo

        placeable-literal = { "Foo" } Bar
        placeable-message = { foo } Bar

        selector-literal = { "Foo" ->
           *[Foo] Member 1
        }

        bar =
            .attr = Bar Attribute

        placeable-attr   = { bar.attr }

        -baz = Baz
            .attr = BazAttribute

        selector-attr    = { -baz.attr ->
           *[BazAttribute] Member 3
        }
        `)
      );
    });

    test("can be used as a value", function () {
      const msg = bundle.getMessage("foo");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "Foo");
      assert.strictEqual(errs.length, 0);
    });

    test("can be used in a placeable", function () {
      const msg = bundle.getMessage("placeable-literal");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "Foo Bar");
      assert.strictEqual(errs.length, 0);
    });

    test("can be a value of a message referenced in a placeable", function () {
      const msg = bundle.getMessage("placeable-message");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "Foo Bar");
      assert.strictEqual(errs.length, 0);
    });

    test("can be a selector", function () {
      const msg = bundle.getMessage("selector-literal");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "Member 1");
      assert.strictEqual(errs.length, 0);
    });

    test("can be used as an attribute value", function () {
      const msg = bundle.getMessage("bar");
      const val = bundle.formatPattern(msg.attributes["attr"], args, errs);
      assert.strictEqual(val, "Bar Attribute");
      assert.strictEqual(errs.length, 0);
    });

    test("can be a value of an attribute used in a placeable", function () {
      const msg = bundle.getMessage("placeable-attr");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "Bar Attribute");
      assert.strictEqual(errs.length, 0);
    });

    test("can be a value of an attribute used as a selector", function () {
      const msg = bundle.getMessage("selector-attr");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "Member 3");
      assert.strictEqual(errs.length, 0);
    });
  });

  suite("Complex string value", function () {
    suiteSetup(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        foo               = Foo
        bar               = { foo }Bar

        placeable-message = { bar }Baz

        baz =
            .attr = { bar }BazAttribute

        placeable-attr = { baz.attr }

        selector-attr = { baz.attr ->
            [FooBarBazAttribute] FooBarBaz
           *[other] Other
        }
        `)
      );
    });

    test("can be used as a value", function () {
      const msg = bundle.getMessage("bar");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "FooBar");
      assert.strictEqual(errs.length, 0);
    });

    test("can be a value of a message referenced in a placeable", function () {
      const msg = bundle.getMessage("placeable-message");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "FooBarBaz");
      assert.strictEqual(errs.length, 0);
    });

    test("can be used as an attribute value", function () {
      const msg = bundle.getMessage("baz");
      const val = bundle.formatPattern(msg.attributes["attr"], args, errs);
      assert.strictEqual(val, "FooBarBazAttribute");
      assert.strictEqual(errs.length, 0);
    });

    test("can be a value of an attribute used in a placeable", function () {
      const msg = bundle.getMessage("placeable-attr");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "FooBarBazAttribute");
      assert.strictEqual(errs.length, 0);
    });

    test("can be a value of an attribute used as a selector", function () {
      const msg = bundle.getMessage("selector-attr");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "FooBarBaz");
      assert.strictEqual(errs.length, 0);
    });
  });
});
