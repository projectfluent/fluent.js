'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from './util';

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
      const msg = ctx.messages.get('one');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, '1');
      assert.equal(errs.length, 0);
    });

    test('can be used as a selector', function(){
      const msg = ctx.messages.get('select');
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
        selector-message = { foo ->
           *[Foo] Member 2
        }

        bar
            .attr = Bar Attribute

        placeable-attr   = { bar.attr }

        selector-attr    = { bar.attr ->
           *[Bar Attribute] Member 3
        }
      `);
    });

    test('can be used as a value', function(){
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo');
      assert.equal(errs.length, 0);
    });

    test('is detected to be non-complex', function(){
      const msg = ctx.messages.get('foo');
      assert.equal(typeof msg, 'string');
    });

    test('can be used in a placeable', function(){
      const msg = ctx.messages.get('placeable-literal');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar');
      assert.equal(errs.length, 0);
    });

    test('can be a value of a message referenced in a placeable', function(){
      const msg = ctx.messages.get('placeable-message');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar');
      assert.equal(errs.length, 0);
    });

    test('can be a selector', function(){
      const msg = ctx.messages.get('selector-literal');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Member 1');
      assert.equal(errs.length, 0);
    });

    test('can be a value of a message used as a selector', function(){
      const msg = ctx.messages.get('selector-message');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Member 2');
      assert.equal(errs.length, 0);
    });

    test('can be used as an attribute value', function(){
      const msg = ctx.messages.get('bar').attrs.attr;
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Bar Attribute');
      assert.equal(errs.length, 0);
    });

    test('can be a value of an attribute used in a placeable', function(){
      const msg = ctx.messages.get('placeable-attr');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Bar Attribute');
      assert.equal(errs.length, 0);
    });

    test('can be a value of an attribute used as a selector', function(){
      const msg = ctx.messages.get('selector-attr');
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

        placeable-literal = { "{ foo } Bar" } Baz
        placeable-message = { bar } Baz

        selector-literal = { "{ foo } Bar" ->
           *[Foo Bar] Member 1
        }
        selector-message = { bar ->
           *[Foo Bar] Member 2
        }

        baz
            .attr = { bar } Baz Attribute

        placeable-attr = { baz.attr }

        selector-attr = { baz.attr ->
           *[Foo Bar Baz Attribute] Member 3
        }
      `);
    });

    test('can be used as a value', function(){
      const msg = ctx.messages.get('bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar');
      assert.equal(errs.length, 0);
    });

    test('is detected to be complex', function(){
      const msg = ctx.messages.get('bar');
      assert.equal(typeof msg, 'object');
      assert(Array.isArray(msg.val));
    });

    test('can be used in a placeable', function(){
      const msg = ctx.messages.get('placeable-literal');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar Baz');
      assert.equal(errs.length, 0);
    });

    test('can be a value of a message referenced in a placeable', function(){
      const msg = ctx.messages.get('placeable-message');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar Baz');
      assert.equal(errs.length, 0);
    });

    test('can be a selector', function(){
      const msg = ctx.messages.get('selector-literal');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Member 1');
      assert.equal(errs.length, 0);
    });

    test('can be a value of a message used as a selector', function(){
      const msg = ctx.messages.get('selector-message');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Member 2');
      assert.equal(errs.length, 0);
    });

    test('can be used as an attribute value', function(){
      const msg = ctx.messages.get('baz').attrs.attr
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar Baz Attribute');
      assert.equal(errs.length, 0);
    });

    test('can be a value of an attribute used in a placeable', function(){
      const msg = ctx.messages.get('placeable-attr');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar Baz Attribute');
      assert.equal(errs.length, 0);
    });

    test('can be a value of an attribute used as a selector', function(){
      const msg = ctx.messages.get('selector-attr');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Member 3');
      assert.equal(errs.length, 0);
    });

  });
});
