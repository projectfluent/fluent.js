"use strict";
import assert from "assert";
import FluentBundle from "../src/bundle";
import {ftl} from "../src/util";

suite("Select expressions", function() {
  let bundle, errs;

  setup(function() {
    bundle = new FluentBundle("en-US", {useIsolating: false});
    errs = [];
  });

  test("missing selector", function() {
    bundle.addMessages(ftl`
      select = {$none ->
          [a] A
         *[b] B
      }
    `);
    const val = bundle.format("select", null, errs);
    assert.equal(val, "B");
    assert.equal(errs.length, 1);
    assert(errs[0] instanceof ReferenceError); // unknown variable
  });

  suite("string selectors", function() {
    test("matching selector", function() {
      bundle.addMessages(ftl`
        select = {$selector ->
            [a] A
           *[b] B
        }
      `);
      const val = bundle.format("select", {selector: "a"}, errs);
      assert.equal(val, "A");
      assert.equal(errs.length, 0);
    });

    test("non-matching selector", function() {
      bundle.addMessages(ftl`
        select = {$selector ->
            [a] A
           *[b] B
        }
      `);
      const val = bundle.format("select", {selector: "c"}, errs);
      assert.equal(val, "B");
      assert.equal(errs.length, 0);
    });
  });

  suite("number selectors", function() {
    test("matching selector", function() {
      bundle.addMessages(ftl`
        select = {$selector ->
            [0] A
           *[1] B
        }
      `);
      const val = bundle.format("select", {selector: 0}, errs);
      assert.equal(val, "A");
      assert.equal(errs.length, 0);
    });

    test("non-matching selector", function() {
      bundle.addMessages(ftl`
        select = {$selector ->
            [0] A
           *[1] B
        }
      `);
      const val = bundle.format("select", {selector: 2}, errs);
      assert.equal(val, "B");
      assert.equal(errs.length, 0);
    });
  });

  suite("plural categories", function() {
    test("matching number selector", function() {
      bundle.addMessages(ftl`
        select = {$selector ->
            [one] A
           *[other] B
        }
      `);
      const val = bundle.format("select", {selector: 1}, errs);
      assert.equal(val, "A");
      assert.equal(errs.length, 0);
    });

    test("matching string selector", function() {
      bundle.addMessages(ftl`
        select = {$selector ->
            [one] A
           *[other] B
        }
      `);
      const val = bundle.format("select", {selector: "one"}, errs);
      assert.equal(val, "A");
      assert.equal(errs.length, 0);
    });

    test("non-matching number selector", function() {
      bundle.addMessages(ftl`
        select = {$selector ->
            [one] A
           *[default] D
        }
      `);
      const val = bundle.format("select", {selector: 2}, errs);
      assert.equal(val, "D");
      assert.equal(errs.length, 0);
    });

    test("non-matching string selector", function() {
      bundle.addMessages(ftl`
        select = {$selector ->
            [one] A
           *[default] D
        }
      `);
      const val = bundle.format("select", {selector: "other"}, errs);
      assert.equal(val, "D");
      assert.equal(errs.length, 0);
    });
  });

});
