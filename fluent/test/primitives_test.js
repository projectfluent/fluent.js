'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from '../src/util';

suite('Primitives', function() {
  let ctx, args, errs;

  setup(function() {
    errs = [];
  });

  suite('Numbers', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        one     = { 1 }
        select  = { 1 ->
           *[0] Zero
            [1] One
        }
      `);
    });

    test('can be used in a placeable', function(){
      const msg = ctx.getMessage('one');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, '1');
      assert.equal(errs.length, 0);
    });

    test('can be used as a selector', function(){
      const msg = ctx.getMessage('select');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'One');
      assert.equal(errs.length, 0);
    });
  });

  suite('Simple string value', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
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
            .attr = Baz Attribute

        selector-attr    = { -baz.attr ->
           *[Baz Attribute] Member 3
        }
      `);
    });

    test('can be used as a value', function(){
      const msg = ctx.getMessage('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo');
      assert.equal(errs.length, 0);
    });

    test('is detected to be non-complex', function(){
      const msg = ctx.getMessage('foo');
      assert.equal(typeof msg, 'string');
    });

    test('can be used in a placeable', function(){
      const msg = ctx.getMessage('placeable-literal');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar');
      assert.equal(errs.length, 0);
    });

    test('can be a value of a message referenced in a placeable', function(){
      const msg = ctx.getMessage('placeable-message');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar');
      assert.equal(errs.length, 0);
    });

    test('can be a selector', function(){
      const msg = ctx.getMessage('selector-literal');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Member 1');
      assert.equal(errs.length, 0);
    });

    test('can be used as an attribute value', function(){
      const msg = ctx.getMessage('bar').attrs.attr;
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Bar Attribute');
      assert.equal(errs.length, 0);
    });

    test('can be a value of an attribute used in a placeable', function(){
      const msg = ctx.getMessage('placeable-attr');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Bar Attribute');
      assert.equal(errs.length, 0);
    });

    test('can be a value of an attribute used as a selector', function(){
      const msg = ctx.getMessage('selector-attr');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Member 3');
      assert.equal(errs.length, 0);
    });
  });

  suite('Complex string value', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo               = Foo
        bar               = { foo } Bar

        placeable-message = { bar } Baz

        baz =
            .attr = { bar } Baz Attribute

        placeable-attr = { baz.attr }

        selector-attr = { baz.attr ->
            [Foo Bar Baz Attribute] Variant
           *[ok] Valid
        }
      `);
    });

    test('can be used as a value', function(){
      const msg = ctx.getMessage('bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar');
      assert.equal(errs.length, 0);
    });

    test('is detected to be complex', function(){
      const msg = ctx.getMessage('bar');
      assert.equal(typeof msg, 'object');
      assert(Array.isArray(msg.val));
    });

    test('can be a value of a message referenced in a placeable', function(){
      const msg = ctx.getMessage('placeable-message');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar Baz');
      assert.equal(errs.length, 0);
    });

    test('can be used as an attribute value', function(){
      const msg = ctx.getMessage('baz').attrs.attr
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar Baz Attribute');
      assert.equal(errs.length, 0);
    });

    test('can be a value of an attribute used in a placeable', function(){
      const msg = ctx.getMessage('placeable-attr');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar Baz Attribute');
      assert.equal(errs.length, 0);
    });

    test.skip('can be a value of an attribute used as a selector', function(){
      const msg = ctx.getMessage('selector-attr');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Variant 2');
      assert.equal(errs.length, 0);
    });

  });
});
