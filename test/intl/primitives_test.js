'use strict';

import assert from 'assert';

import { MessageContext } from '../../src/intl/context';
import { ftl } from '../util';

describe('Primitives', function() {
  let ctx, args, errs;

  beforeEach(function() {
    errs = [];
  });

  describe('Numbers', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        one     = { 1 }
        select  = { 1 ->
            [1] One
        }
      `);
    });

    it('can be used in a placeable', function(){
      const msg = ctx.messages.get('one');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, '1');
      assert.equal(errs.length, 0);
    });

    it('can be used as a selector', function(){
      const msg = ctx.messages.get('select');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'One');
      assert.equal(errs.length, 0);
    });
  });

  describe('Simple string value', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo               = Foo

        placeable-literal = { "Foo" } Bar
        placeable-entity  = { foo } Bar

        selector-literal  = { "Foo" ->
            [Foo] Member 1
        }
        selector-entity   = { foo ->
            [Foo] Member 2
        }

        bar               =
            [trait] Bar Trait

        placeable-trait   = { bar[trait] }

        selector-trait    = { bar[trait] ->
            [Bar Trait] Member 3
        }
      `);
    });

    it('can be used as a value', function(){
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo');
      assert.equal(errs.length, 0);
    });

    it('is detected to be non-complex', function(){
      const msg = ctx.messages.get('foo');
      assert.equal(typeof msg, 'string');
    });

    it('can be used in a placeable', function(){
      const msg = ctx.messages.get('placeable-literal');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar');
      assert.equal(errs.length, 0);
    });

    it('can be a value of an entity referenced in a placeable', function(){
      const msg = ctx.messages.get('placeable-entity');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar');
      assert.equal(errs.length, 0);
    });

    it('can be a selector', function(){
      const msg = ctx.messages.get('selector-literal');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Member 1');
      assert.equal(errs.length, 0);
    });

    it('can be a value of an entity used as a selector', function(){
      const msg = ctx.messages.get('selector-entity');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Member 2');
      assert.equal(errs.length, 0);
    });

    it('can be used as a trait value', function(){
      const msg = ctx.messages.get('bar').traits[0];
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Bar Trait');
      assert.equal(errs.length, 0);
    });

    it('can be a value of a trait used in a placeable', function(){
      const msg = ctx.messages.get('placeable-trait');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Bar Trait');
      assert.equal(errs.length, 0);
    });

    it('can be a value of a trait used as a selector', function(){
      const msg = ctx.messages.get('selector-trait');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Member 3');
      assert.equal(errs.length, 0);
    });
  });

  describe('Complex string value', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo               = Foo
        bar               = { foo } Bar

        placeable-literal = { "{ foo } Bar" } Baz
        placeable-entity  = { bar } Baz

        selector-literal  = { "{ foo } Bar" ->
            [Foo Bar] Member 1
        }
        selector-entity   = { bar ->
            [Foo Bar] Member 2
        }

        baz               =
            [trait] { bar } Baz Trait

        placeable-trait   = { baz[trait] }

        selector-trait    = { baz[trait] ->
            [Foo Bar Baz Trait] Member 3
        }
      `);
    });

    it('can be used as a value', function(){
      const msg = ctx.messages.get('bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar');
      assert.equal(errs.length, 0);
    });

    it('is detected to be complex', function(){
      const msg = ctx.messages.get('bar');
      assert.equal(typeof msg, 'object');
      assert(Array.isArray(msg.val));
    });

    it('can be used in a placeable', function(){
      const msg = ctx.messages.get('placeable-literal');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar Baz');
      assert.equal(errs.length, 0);
    });

    it('can be a value of an entity referenced in a placeable', function(){
      const msg = ctx.messages.get('placeable-entity');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar Baz');
      assert.equal(errs.length, 0);
    });

    it('can be a selector', function(){
      const msg = ctx.messages.get('selector-literal');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Member 1');
      assert.equal(errs.length, 0);
    });

    it('can be a value of an entity used as a selector', function(){
      const msg = ctx.messages.get('selector-entity');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Member 2');
      assert.equal(errs.length, 0);
    });

    it('can be used as a trait value', function(){
      const msg = ctx.messages.get('baz').traits[0];
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar Baz Trait');
      assert.equal(errs.length, 0);
    });

    it('can be a value of a trait used in a placeable', function(){
      const msg = ctx.messages.get('placeable-trait');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Bar Baz Trait');
      assert.equal(errs.length, 0);
    });

    it('can be a value of a trait used as a selector', function(){
      const msg = ctx.messages.get('selector-trait');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Member 3');
      assert.equal(errs.length, 0);
    });

  });
});
