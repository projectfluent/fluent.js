import assert from "assert";
import ftl from "@fluent/dedent";

import { FluentBundle } from "../esm/bundle.js";
import { FluentResource } from "../esm/resource.js";

suite("Interesting Object properties", function () {
  let bundle, errs;

  beforeEach(function () {
    errs = [];
  });

  suite("Object.prototype.constructor", function () {
    beforeAll(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        test = {$constructor}
        `)
      );
    });

    test("empty args literal", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, {}, errs);
      assert.strictEqual(val, "{$constructor}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });

    test("empty args with null prototype", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, Object.create(null), errs);
      assert.strictEqual(val, "{$constructor}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });

    test("own property", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, { constructor: 1 }, errs);
      assert.strictEqual(val, "1");
      assert.strictEqual(errs.length, 0);
    });
  });

  suite("Object.prototype.hasOwnProperty", function () {
    beforeAll(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        test = {$hasOwnProperty}
        `)
      );
    });

    test("empty args literal", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, {}, errs);
      assert.strictEqual(val, "{$hasOwnProperty}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });

    test("empty args with null prototype", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, Object.create(null), errs);
      assert.strictEqual(val, "{$hasOwnProperty}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });

    test("own property", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, { hasOwnProperty: 1 }, errs);
      assert.strictEqual(val, "1");
      assert.strictEqual(errs.length, 0);
    });
  });

  suite("Object.prototype.isPrototypeOf", function () {
    beforeAll(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        test = {$isPrototypeOf}
        `)
      );
    });

    test("empty args literal", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, {}, errs);
      assert.strictEqual(val, "{$isPrototypeOf}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });

    test("empty args with null prototype", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, Object.create(null), errs);
      assert.strictEqual(val, "{$isPrototypeOf}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });

    test("own property", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, { isPrototypeOf: 1 }, errs);
      assert.strictEqual(val, "1");
      assert.strictEqual(errs.length, 0);
    });
  });

  suite("Object.prototype.propertyIsEnumerable", function () {
    beforeAll(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        test = {$propertyIsEnumerable}
        `)
      );
    });

    test("empty args literal", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, {}, errs);
      assert.strictEqual(val, "{$propertyIsEnumerable}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });

    test("empty args with null prototype", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, Object.create(null), errs);
      assert.strictEqual(val, "{$propertyIsEnumerable}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });

    test("own property", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(
        msg.value,
        { propertyIsEnumerable: 1 },
        errs
      );
      assert.strictEqual(val, "1");
      assert.strictEqual(errs.length, 0);
    });
  });

  suite("Object.prototype.toLocaleString", function () {
    beforeAll(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        test = {$toLocaleString}
        `)
      );
    });

    test("empty args literal", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, {}, errs);
      assert.strictEqual(val, "{$toLocaleString}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });

    test("empty args with null prototype", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, Object.create(null), errs);
      assert.strictEqual(val, "{$toLocaleString}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });

    test("own property", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, { toLocaleString: 1 }, errs);
      assert.strictEqual(val, "1");
      assert.strictEqual(errs.length, 0);
    });
  });

  suite("Object.prototype.toString", function () {
    beforeAll(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        test = {$toString}
        `)
      );
    });

    test("empty args literal", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, {}, errs);
      assert.strictEqual(val, "{$toString}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });

    test("empty args with null prototype", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, Object.create(null), errs);
      assert.strictEqual(val, "{$toString}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });

    test("own property", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, { toString: 1 }, errs);
      assert.strictEqual(val, "1");
      assert.strictEqual(errs.length, 0);
    });
  });

  suite("Object.prototype.valueOf", function () {
    beforeAll(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        test = {$valueOf}
        `)
      );
    });

    test("empty args literal", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, {}, errs);
      assert.strictEqual(val, "{$valueOf}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });

    test("empty args with null property", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, Object.create(null), errs);
      assert.strictEqual(val, "{$valueOf}");
      assert.strictEqual(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });

    test("own property", function () {
      const msg = bundle.getMessage("test");
      const val = bundle.formatPattern(msg.value, { valueOf: 1 }, errs);
      assert.strictEqual(val, "1");
      assert.strictEqual(errs.length, 0);
    });
  });
});
