"use strict";

import assert from "assert";
import ftl from "@fluent/dedent";

import {FluentBundle} from "../esm/bundle";
import {FluentResource} from '../esm/resource';

suite("Errors", function() {
  let bundle;

  suiteSetup(function() {
    bundle = new FluentBundle("en-US", { useIsolating: false });
    bundle.addResource(new FluentResource(ftl`
      foo = {$one} and {$two}
      `));
  });

  test("Reporting into an array", function() {
    let errors = [];
    let message = bundle.getMessage("foo");

    let val1 = bundle.formatPattern(message.value, {}, errors);
    assert.strictEqual(val1, "{$one} and {$two}");
    assert.strictEqual(errors.length, 2);
    assert.ok(errors[0] instanceof ReferenceError);
    assert.ok(errors[1] instanceof ReferenceError);

    let val2 = bundle.formatPattern(message.value, {}, errors);
    assert.strictEqual(val2, "{$one} and {$two}");
    assert.strictEqual(errors.length, 4);
    assert.ok(errors[0] instanceof ReferenceError);
    assert.ok(errors[1] instanceof ReferenceError);
    assert.ok(errors[2] instanceof ReferenceError);
    assert.ok(errors[3] instanceof ReferenceError);
  });

  test("First error is thrown", function() {
    let message = bundle.getMessage("foo");
    assert.throws(
      () => bundle.formatPattern(message.value, {}),
      ReferenceError,
      "Unknown variable: $one"
    );
  });
});
