'use strict';

import assert from 'assert';
import ftl from "@fluent/dedent";

import FluentBundle from '../src/bundle';

suite('Transformations', function(){
  let bundle, errs;

  suiteSetup(function() {
    bundle = new FluentBundle('en-US', {
      transform: v => v.replace(/a/g, "A"),
      useIsolating: false,
    });
    bundle.addMessages(ftl`
      foo = Faa
          .bar = Bar {foo} Baz
      bar = Bar {"Baz"}
      qux = {"faa" ->
          [faa] Faa
         *[bar] Bar
      }
      arg = Faa {$arg}
      `);
  });

  setup(function() {
    errs = [];
  });

  test('transforms TextElements', function(){
    const msg = bundle.getMessage('foo');
    const val = bundle.formatPattern(msg.value, {}, errs);
    const attr = bundle.formatPattern(msg.attributes["bar"], {}, errs);
    assert.strictEqual(val, "FAA");
    assert.strictEqual(attr, "BAr FAA BAz");
    assert.strictEqual(errs.length, 0);
  });

  test('does not transform StringLiterls', function(){
    const msg = bundle.getMessage('bar');
    const val = bundle.formatPattern(msg.value, {}, errs);
    assert.strictEqual(val, "BAr Baz");
    assert.strictEqual(errs.length, 0);
  });

  test('does not transform VariantKeys', function(){
    const msg = bundle.getMessage('qux');
    const val = bundle.formatPattern(msg.value, {}, errs);
    assert.strictEqual(val, "FAA");
    assert.strictEqual(errs.length, 0);
  });

  test('does not transform Variables', function(){
    const msg = bundle.getMessage('arg');
    const val = bundle.formatPattern(msg.value, {arg: "aaa"}, errs);
    assert.strictEqual(val, "FAA aaa");
    assert.strictEqual(errs.length, 0);
  });
});
