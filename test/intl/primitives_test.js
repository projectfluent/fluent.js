'use strict';

import assert from 'assert';

import { MessageContext } from '../../src/intl/context';
import { ftl, bdi } from '../util';

describe('Primitives', function() {
  let ctx, args, errs;

  beforeEach(function() {
    errs = [];
  });

  describe('Numbers', function(){
    before(function() {
      ctx = new MessageContext('en-US');
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
      assert.equal(val, bdi`[1]`);
      assert.deepEqual(errs, []);
    });

    it('can be used as a selector', function(){
      const msg = ctx.messages.get('select');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[One]`);
      assert.deepEqual(errs, []);
    });
  });

  describe('Simple string value', function(){
    before(function() {
      ctx = new MessageContext('en-US');
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
      assert.deepEqual(errs, []);
    });

    it('is detected to be non-complex', function(){
      const msg = ctx.messages.get('foo');
      assert.equal(typeof msg, 'string');
    });

    it('can be used in a placeable', function(){
      const msg = ctx.messages.get('placeable-literal');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Foo] Bar`);
      assert.deepEqual(errs, []);
    });

    it('can be a value of an entity referenced in a placeable', function(){
      const msg = ctx.messages.get('placeable-entity');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Foo] Bar`);
      assert.deepEqual(errs, []);
    });

    it('can be a selector', function(){
      const msg = ctx.messages.get('selector-literal');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Member 1]`);
      assert.deepEqual(errs, []);
    });

    it('can be a value of an entity used as a selector', function(){
      const msg = ctx.messages.get('selector-entity');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Member 2]`);
      assert.deepEqual(errs, []);
    });

    it('can be used as a trait value', function(){
      const msg = ctx.messages.get('bar').traits[0];
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Bar Trait');
      assert.deepEqual(errs, []);
    });

    it('can be a value of a trait used in a placeable', function(){
      const msg = ctx.messages.get('placeable-trait');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Bar Trait]`);
      assert.deepEqual(errs, []);
    });

    it('can be a value of a trait used as a selector', function(){
      const msg = ctx.messages.get('selector-trait');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Member 3]`);
      assert.deepEqual(errs, []);
    });
  });

  describe('Complex string value', function(){
    before(function() {
      ctx = new MessageContext('en-US');
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
      assert.equal(val, bdi`[Foo] Bar`);
      assert.deepEqual(errs, []);
    });

    it('is detected to be complex', function(){
      const msg = ctx.messages.get('bar');
      assert.equal(typeof msg, 'object');
      assert(Array.isArray(msg.val));
    });

    it('can be used in a placeable', function(){
      const msg = ctx.messages.get('placeable-literal');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[[Foo] Bar] Baz`);
      assert.deepEqual(errs, []);
    });

    it('can be a value of an entity referenced in a placeable', function(){
      const msg = ctx.messages.get('placeable-entity');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[[Foo] Bar] Baz`);
      assert.deepEqual(errs, []);
    });

    // XXX FSI/PDI break the key matching
    it.skip('can be a selector', function(){
      const msg = ctx.messages.get('selector-literal');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Member 1]`);
      assert.deepEqual(errs, []);
    });

    // XXX FSI/PDI break the key matching
    it.skip('can be a value of an entity used as a selector', function(){
      const msg = ctx.messages.get('selector-entity');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Member 2]`);
      assert.deepEqual(errs, []);
    });

    it('can be used as a trait value', function(){
      const msg = ctx.messages.get('baz').traits[0];
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[[Foo] Bar] Baz Trait`);
      assert.deepEqual(errs, []);
    });

    it('can be a value of a trait used in a placeable', function(){
      const msg = ctx.messages.get('placeable-trait');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[[[Foo] Bar] Baz Trait]`);
      assert.deepEqual(errs, []);
    });

    // XXX FSI/PDI break the key matching
    it.skip('can be a value of a trait used as a selector', function(){
      const msg = ctx.messages.get('selector-trait');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Member 3]`);
      assert.deepEqual(errs, []);
    });

  });
});
