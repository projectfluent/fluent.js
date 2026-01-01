import assert from "assert";
import ftl from "@fluent/dedent";

import { FluentBundle } from "../src/bundle.ts";
import { FluentResource } from "../src/resource.ts";

suite("Attributes", function () {
  let bundle, args, errs;

  beforeEach(function () {
    errs = [];
  });

  suite("missing", function () {
    beforeAll(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        foo = Foo
        bar = Bar
            .attr = Bar Attribute
        baz = { foo } Baz
        qux = { foo } Qux
            .attr = Qux Attribute

        ref-foo = { foo.missing }
        ref-bar = { bar.missing }
        ref-baz = { baz.missing }
        ref-qux = { qux.missing }
        `)
      );
    });

    test("falls back to id.attr for entities with string values and no attributes", function () {
      const msg = bundle.getMessage("ref-foo");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "{foo.missing}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown attribute
    });

    test("falls back to id.attr for entities with string values and other attributes", function () {
      const msg = bundle.getMessage("ref-bar");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "{bar.missing}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown attribute
    });

    test("falls back to id.attr for entities with pattern values and no attributes", function () {
      const msg = bundle.getMessage("ref-baz");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "{baz.missing}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown attribute
    });

    test("falls back to id.attr for entities with pattern values and other attributes", function () {
      const msg = bundle.getMessage("ref-qux");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "{qux.missing}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown attribute
    });
  });

  suite("with string values", function () {
    beforeAll(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        foo = Foo
            .attr = Foo Attribute
        bar = { foo } Bar
            .attr = Bar Attribute

        ref-foo = { foo.attr }
        ref-bar = { bar.attr }
        `)
      );
    });

    test("can be referenced for entities with string values", function () {
      const msg = bundle.getMessage("ref-foo");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "Foo Attribute");
      assert.strictEqual(errs.length, 0);
    });

    test("can be formatted directly for entities with string values", function () {
      const msg = bundle.getMessage("foo");
      const val = bundle.formatPattern(msg.attributes.attr, args, errs);
      assert.strictEqual(val, "Foo Attribute");
      assert.strictEqual(errs.length, 0);
    });

    test("can be referenced for entities with pattern values", function () {
      const msg = bundle.getMessage("ref-bar");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "Bar Attribute");
      assert.strictEqual(errs.length, 0);
    });

    test("can be formatted directly for entities with pattern values", function () {
      const msg = bundle.getMessage("bar");
      const val = bundle.formatPattern(msg.attributes.attr, args, errs);
      assert.strictEqual(val, "Bar Attribute");
      assert.strictEqual(errs.length, 0);
    });
  });

  suite("with simple pattern values", function () {
    beforeAll(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        foo = Foo
        bar = Bar
            .attr = { foo } Attribute
        baz = { foo } Baz
            .attr = { foo } Attribute
        qux = Qux
            .attr = { qux } Attribute

        ref-bar = { bar.attr }
        ref-baz = { baz.attr }
        ref-qux = { qux.attr }
        `)
      );
    });

    test("can be referenced for entities with string values", function () {
      const msg = bundle.getMessage("ref-bar");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "Foo Attribute");
      assert.strictEqual(errs.length, 0);
    });

    test("can be formatted directly for entities with string values", function () {
      const msg = bundle.getMessage("bar");
      const val = bundle.formatPattern(msg.attributes.attr, args, errs);
      assert.strictEqual(val, "Foo Attribute");
      assert.strictEqual(errs.length, 0);
    });

    test("can be referenced for entities with simple pattern values", function () {
      const msg = bundle.getMessage("ref-baz");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "Foo Attribute");
      assert.strictEqual(errs.length, 0);
    });

    test("can be formatted directly for entities with simple pattern values", function () {
      const msg = bundle.getMessage("baz");
      const val = bundle.formatPattern(msg.attributes.attr, args, errs);
      assert.strictEqual(val, "Foo Attribute");
      assert.strictEqual(errs.length, 0);
    });

    test("works with self-references", function () {
      const msg = bundle.getMessage("ref-qux");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "Qux Attribute");
      assert.strictEqual(errs.length, 0);
    });

    test("can be formatted directly when it uses a self-reference", function () {
      const msg = bundle.getMessage("qux");
      const val = bundle.formatPattern(msg.attributes.attr, args, errs);
      assert.strictEqual(val, "Qux Attribute");
      assert.strictEqual(errs.length, 0);
    });
  });

  suite("with values with select expressions", function () {
    beforeAll(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        foo = Foo
            .attr = { "a" ->
                        [a] A
                       *[b] B
                    }

        ref-foo = { foo.attr }
        `)
      );
    });

    test("can be referenced", function () {
      const msg = bundle.getMessage("ref-foo");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "A");
      assert.strictEqual(errs.length, 0);
    });

    test("can be formatted directly", function () {
      const msg = bundle.getMessage("foo");
      const val = bundle.formatPattern(msg.attributes.attr, args, errs);
      assert.strictEqual(val, "A");
      assert.strictEqual(errs.length, 0);
    });
  });
});
