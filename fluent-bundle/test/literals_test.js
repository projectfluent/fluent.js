"use strict";
import assert from "assert";
import ftl from "@fluent/dedent";

import FluentBundle from "../src/bundle";
import FluentResource from '../src/resource';

suite('Literals as selectors', function() {
  let bundle, errs;

  setup(function() {
    bundle = new FluentBundle('en-US', {useIsolating: false});
    errs = [];
  });

  test('a matching string literal selector', function() {
    bundle.addResource(new FluentResource(ftl`
      foo = { "a" ->
          [a] A
         *[b] B
      }
      `));
    const msg = bundle.getMessage('foo');
    const val = bundle.formatPattern(msg.value, null, errs);
    assert.strictEqual(val, 'A');
    assert.strictEqual(errs.length, 0);
  });

  test('a non-matching string literal selector', function() {
    bundle.addResource(new FluentResource(ftl`
      foo = { "c" ->
          [a] A
         *[b] B
      }
      `));
    const msg = bundle.getMessage('foo');
    const val = bundle.formatPattern(msg.value, null, errs);
    assert.strictEqual(val, 'B');
    assert.strictEqual(errs.length, 0);
  });

  test('a matching number literal selector', function() {
    bundle.addResource(new FluentResource(ftl`
      foo = { 0 ->
          [0] A
         *[1] B
      }
      `));
    const msg = bundle.getMessage('foo');
    const val = bundle.formatPattern(msg.value, null, errs);
    assert.strictEqual(val, 'A');
    assert.strictEqual(errs.length, 0);
  });

  test('a non-matching number literal selector', function() {
    bundle.addResource(new FluentResource(ftl`
      foo = { 2 ->
          [0] A
         *[1] B
      }
      `));
    const msg = bundle.getMessage('foo');
    const val = bundle.formatPattern(msg.value, null, errs);
    assert.strictEqual(val, 'B');
    assert.strictEqual(errs.length, 0);
  });

  test('a number literal selector matching a plural category', function() {
    bundle.addResource(new FluentResource(ftl`
      foo = { 1 ->
          [one] A
         *[other] B
      }
      `));
    const msg = bundle.getMessage('foo');
    const val = bundle.formatPattern(msg.value, null, errs);
    assert.strictEqual(val, 'A');
    assert.strictEqual(errs.length, 0);
  });
});
