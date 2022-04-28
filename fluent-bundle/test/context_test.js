"use strict";

import assert from "assert";
import ftl from "@fluent/dedent";

import { FluentBundle } from "../esm/bundle.js";
import { FluentResource } from "../esm/resource.js";

suite("Bundle", function () {
  let bundle;

  suite("addResource", function () {
    suiteSetup(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        foo = Foo
        -bar = Bar
        `)
      );
    });

    test("adds messages", function () {
      assert.strictEqual(bundle._messages.has("foo"), true);
      assert.strictEqual(bundle._terms.has("foo"), false);
      assert.strictEqual(bundle._messages.has("-bar"), false);
      assert.strictEqual(bundle._terms.has("-bar"), true);
    });

    test("preserves existing messages when new are added", function () {
      bundle.addResource(
        new FluentResource(ftl`
        baz = Baz
        `)
      );

      assert.strictEqual(bundle._messages.has("foo"), true);
      assert.strictEqual(bundle._terms.has("foo"), false);
      assert.strictEqual(bundle._messages.has("-bar"), false);
      assert.strictEqual(bundle._terms.has("-bar"), true);

      assert.strictEqual(bundle._messages.has("baz"), true);
      assert.strictEqual(bundle._terms.has("baz"), false);
    });

    test("messages and terms can share the same name", function () {
      bundle.addResource(
        new FluentResource(ftl`
        -foo = Private Foo
        `)
      );
      assert.strictEqual(bundle._messages.has("foo"), true);
      assert.strictEqual(bundle._terms.has("foo"), false);
      assert.strictEqual(bundle._messages.has("-foo"), false);
      assert.strictEqual(bundle._terms.has("-foo"), true);
    });
  });

  suite("allowOverrides", function () {
    suiteSetup(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      let resource1 = new FluentResource("key = Foo");
      bundle.addResource(resource1);
    });

    test("addResource allowOverrides is false", function () {
      let resource2 = new FluentResource("key = Bar");
      let errors = bundle.addResource(resource2);
      assert.strictEqual(errors.length, 1);
      let msg = bundle.getMessage("key");
      assert.strictEqual(bundle.formatPattern(msg.value), "Foo");
    });

    test("addResource allowOverrides is true", function () {
      let resource2 = new FluentResource("key = Bar");
      let errors = bundle.addResource(resource2, { allowOverrides: true });
      assert.strictEqual(errors.length, 0);
      let msg = bundle.getMessage("key");
      assert.strictEqual(bundle.formatPattern(msg.value), "Bar");
    });
  });

  suite("hasMessage", function () {
    suiteSetup(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        foo = Foo
        bar =
            .attr = Bar Attr
        -term = Term

        # ERROR No value.
        err1 =
        # ERROR Broken value.
        err2 = {}
        # ERROR No attribute value.
        err3 =
            .attr =
        # ERROR Broken attribute value.
        err4 =
            .attr1 = Attr
            .attr2 = {}
        `)
      );
    });

    test("returns true only for public messages", function () {
      assert.strictEqual(bundle.hasMessage("foo"), true);
    });

    test("returns false for terms and missing messages", function () {
      assert.strictEqual(bundle.hasMessage("-term"), false);
      assert.strictEqual(bundle.hasMessage("missing"), false);
      assert.strictEqual(bundle.hasMessage("-missing"), false);
    });

    test("returns false for broken messages", function () {
      assert.strictEqual(bundle.hasMessage("err1"), false);
      assert.strictEqual(bundle.hasMessage("err2"), false);
      assert.strictEqual(bundle.hasMessage("err3"), false);
      assert.strictEqual(bundle.hasMessage("err4"), false);
    });
  });

  suite("getMessage", function () {
    suiteSetup(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        foo = Foo
        -bar = Bar
        `)
      );
    });

    test("returns public messages", function () {
      assert.deepEqual(bundle.getMessage("foo"), {
        id: "foo",
        value: "Foo",
        attributes: {},
      });
    });

    test("returns undefined for terms and missing messages", function () {
      assert.strictEqual(bundle.getMessage("-bar"), undefined);
      assert.strictEqual(bundle.getMessage("baz"), undefined);
      assert.strictEqual(bundle.getMessage("-baz"), undefined);
    });
  });
});
