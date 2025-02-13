"use strict";

import assert from "assert";

import { FluentBundle } from "../esm/bundle.js";
import { FluentResource } from "../esm/resource.js";
import { FluentCaster, FluentCastRegistry } from "../esm/cast.js";
import { FluentType } from "../esm/types.js";

suite("Variable casting", function () {
  class MyClass {
    constructor(value = undefined) {
      this.value = value;
    }
  }

  function myCast(value) {
    if (value instanceof MyClass) {
      return "custom value";
    }
  }

  class MyCast extends FluentCaster {
    castValue(value) {
      if (value instanceof MyClass) {
        return "custom value";
      }
    }
  }

  class MyType extends FluentType {
    toString(scope) {
      return "custom type";
    }
  }

  let resource, bundle, errs, msg;

  suiteSetup(function () {
    resource = new FluentResource("message = { $var }");
  });

  setup(function () {
    errs = [];
  });

  suite('cast option', function () {
    suite('with a function', function () {
      suiteSetup(function () {
        bundle = new FluentBundle("en-US", {
          cast: myCast
        });
        bundle.addResource(resource);
        msg = bundle.getMessage("message");
      });

      test("uses custom casting function", function () {
        const val = bundle.formatPattern(msg.value,  { var: new MyClass() }, errs);
        assert.strictEqual(val, "custom value");
        assert.strictEqual(errs.length, 0);
      });

      test("still uses default casting function", function () {
        const val = bundle.formatPattern(msg.value, { var: new Date("1993-02-02") }, errs);
        assert.strictEqual(val, "2/2/1993");
        assert.strictEqual(errs.length, 0);
      });

      test("causes an error if the value cannot be casted", function () {
        const val = bundle.formatPattern(msg.value, { var: {} }, errs);
        assert.strictEqual(val, "{$var}");
        assert.strictEqual(errs.length, 1);
        assert(errs[0] instanceof TypeError);
      });
    });

    suite('with a FluentCaster', function () {
      suiteSetup(function () {
        bundle = new FluentBundle("en-US", {
          cast: new MyCast()
        });
        bundle.addResource(resource);
        msg = bundle.getMessage("message");
      });

      test("uses custom casting function", function () {
        const val = bundle.formatPattern(msg.value,  { var: new MyClass() }, errs);
        assert.strictEqual(val, "custom value");
        assert.strictEqual(errs.length, 0);
      });

      test("still uses default casting function", function () {
        const val = bundle.formatPattern(msg.value, { var: new Date("1993-02-02") }, errs);
        assert.strictEqual(val, "2/2/1993");
        assert.strictEqual(errs.length, 0);
      });

      test("causes an error if the value cannot be casted", function () {
        const val = bundle.formatPattern(msg.value, { var: {} }, errs);
        assert.strictEqual(val, "{$var}");
        assert.strictEqual(errs.length, 1);
        assert(errs[0] instanceof TypeError);
      });
    })
  });

  suite('addCast', function () {
    suite('with a class and a function', function () {
      suiteSetup(function () {
        bundle = new FluentBundle("en-US");
        bundle.addCast(MyClass, function () {
          return "custom value"
        });
        bundle.addResource(resource);
        msg = bundle.getMessage("message");
      });

      test("uses custom casting function", function () {
        const val = bundle.formatPattern(msg.value,  { var: new MyClass() }, errs);
        assert.strictEqual(val, "custom value");
        assert.strictEqual(errs.length, 0);
      });

      test("still uses default casting function", function () {
        const val = bundle.formatPattern(msg.value, { var: new Date("1993-02-02") }, errs);
        assert.strictEqual(val, "2/2/1993");
        assert.strictEqual(errs.length, 0);
      });

      test("causes an error if the value cannot be casted", function () {
        const val = bundle.formatPattern(msg.value, { var: {} }, errs);
        assert.strictEqual(val, "{$var}");
        assert.strictEqual(errs.length, 1);
        assert(errs[0] instanceof TypeError);
      });
    });

    suite('with a class and a type', function () {
      suiteSetup(function () {
        bundle = new FluentBundle("en-US");
        bundle.addCast(MyClass, MyType);
        bundle.addResource(resource);
        msg = bundle.getMessage("message");
      });

      test("uses custom casting function", function () {
        const val = bundle.formatPattern(msg.value,  { var: new MyClass() }, errs);
        assert.strictEqual(val, "custom type");
        assert.strictEqual(errs.length, 0);
      });

      test("still uses default casting function", function () {
        const val = bundle.formatPattern(msg.value, { var: new Date("1993-02-02") }, errs);
        assert.strictEqual(val, "2/2/1993");
        assert.strictEqual(errs.length, 0);
      });

      test("causes an error if the value cannot be casted", function () {
        const val = bundle.formatPattern(msg.value, { var: {} }, errs);
        assert.strictEqual(val, "{$var}");
        assert.strictEqual(errs.length, 1);
        assert(errs[0] instanceof TypeError);
      });
    });

    suite('with a function', function () {
      suiteSetup(function () {
        bundle = new FluentBundle("en-US");
        bundle.addCast(myCast);
        bundle.addResource(resource);
        msg = bundle.getMessage("message");
      });

      test("uses custom casting function", function () {
        const val = bundle.formatPattern(msg.value,  { var: new MyClass() }, errs);
        assert.strictEqual(val, "custom value");
        assert.strictEqual(errs.length, 0);
      });

      test("still uses default casting function", function () {
        const val = bundle.formatPattern(msg.value, { var: new Date("1993-02-02") }, errs);
        assert.strictEqual(val, "2/2/1993");
        assert.strictEqual(errs.length, 0);
      });

      test("causes an error if the value cannot be casted", function () {
        const val = bundle.formatPattern(msg.value, { var: {} }, errs);
        assert.strictEqual(val, "{$var}");
        assert.strictEqual(errs.length, 1);
        assert(errs[0] instanceof TypeError);
      });
    });
  });

  suite("FluentCastRegistry", function () {
    let registry;
    let object = { foo: "bar" };

    suiteSetup(function () {
      registry = new FluentCastRegistry();
      registry.add(MyClass, MyType);
      registry.add("boolean", function () {
        return "true/false"
      });
      registry.add(function (value) {
        if (typeof value === "number" && value % 2 === 0) {
          return "even";
        }
      });
      registry.add(object, function () {
        return "custom object";
      })
    });

    test("matches on class", function () {
      const result = registry.castValue(new MyClass());
      assert(result instanceof MyType);
    });

    test("matches on type", function () {
      const result = registry.castValue(true);
      assert.strictEqual(result, "true/false");
    });

    test("matches on function", function () {
      const result = registry.castValue(2);
      assert.strictEqual(result, "even");
    });

    test("matches on object", function () {
      const result = registry.castValue(object);
      assert.strictEqual(result, "custom object");
    });

    test("returns undefined if no match", function () {
      const result = registry.castValue(1);
      assert.strictEqual(result, undefined);
    });
  });
});