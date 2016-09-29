'use strict';

import assert from 'assert';

import { MessageContext } from '../../src/intl/context';
import { ftl, bdi } from '../util';

describe('Traits', function() {
  let ctx, args, errs;

  beforeEach(function() {
    errs = [];
  });

  describe('missing', function(){
    before(function() {
      ctx = new MessageContext('en-US');
      ctx.addMessages(ftl`
        foo = Foo
        bar = Bar
            [trait] Bar Trait
        baz = { foo } Baz
        qux = { foo } Qux
            [trait] Qux Trait

        ref-foo = { foo[missing] }
        ref-bar = { bar[missing] }
        ref-baz = { baz[missing] }
        ref-qux = { qux[missing] }
      `);
    });

    it('falls back gracefully for entities with string values and no traits', function() {
      const msg = ctx.messages.get('ref-foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Foo]`);
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown trait
    });

    it('falls back gracefully for entities with string values and other traits', function() {
      const msg = ctx.messages.get('ref-bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Bar]`);
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown trait
    });

    it('falls back gracefully for entities with pattern values and no traits', function() {
      const msg = ctx.messages.get('ref-baz');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[[Foo] Baz]`);
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown trait
    });

    it('falls back gracefully for entities with pattern values and other traits', function() {
      const msg = ctx.messages.get('ref-qux');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[[Foo] Qux]`);
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown trait
    });
  });

  describe('with string values', function(){
    before(function() {
      ctx = new MessageContext('en-US');
      ctx.addMessages(ftl`
        foo = Foo
            [trait] Foo Trait
        bar = { foo } Bar
            [trait] Bar Trait

        ref-foo = { foo[trait] }
        ref-bar = { bar[trait] }
      `);
    });

    it('can be referenced for entities with string values', function() {
      const msg = ctx.messages.get('ref-foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Foo Trait]`);
      assert.equal(errs.length, 0);
    });

    it('can be formatted directly for entities with string values', function() {
      const msg = ctx.messages.get('foo').traits[0];
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`Foo Trait`);
      assert.equal(errs.length, 0);
    });

    it('can be referenced for entities with pattern values', function() {
      const msg = ctx.messages.get('ref-bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Bar Trait]`);
      assert.equal(errs.length, 0);
    });

    it('can be formatted directly for entities with pattern values', function() {
      const msg = ctx.messages.get('bar').traits[0];
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`Bar Trait`);
      assert.equal(errs.length, 0);
    });
  });

  describe('with simple pattern values', function(){
    before(function() {
      ctx = new MessageContext('en-US');
      ctx.addMessages(ftl`
        foo = Foo
        bar = Bar
            [trait] { foo } Trait
        baz = { foo } Baz
            [trait] { foo } Trait
        qux = Qux
            [trait] { qux } Trait

        ref-bar = { bar[trait] }
        ref-baz = { baz[trait] }
        ref-qux = { qux[trait] }
      `);
    });

    it('can be referenced for entities with string values', function() {
      const msg = ctx.messages.get('ref-bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[[Foo] Trait]`);
      assert.equal(errs.length, 0);
    });

    it('can be formatted directly for entities with string values', function() {
      const msg = ctx.messages.get('bar').traits[0];
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Foo] Trait`);
      assert.equal(errs.length, 0);
    });

    it('can be referenced for entities with simple pattern values', function() {
      const msg = ctx.messages.get('ref-baz');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[[Foo] Trait]`);
      assert.equal(errs.length, 0);
    });

    it('can be formatted directly for entities with simple pattern values', function() {
      const msg = ctx.messages.get('baz').traits[0];
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Foo] Trait`);
      assert.equal(errs.length, 0);
    });

    it('works with self-references', function() {
      const msg = ctx.messages.get('ref-qux');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[[Qux] Trait]`);
      assert.equal(errs.length, 0);
    });

    it('can be formatted directly when it uses a self-reference', function() {
      const msg = ctx.messages.get('qux').traits[0];
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[Qux] Trait`);
      assert.equal(errs.length, 0);
    });
  });

  describe('with values with select expressions', function(){
    before(function() {
      ctx = new MessageContext('en-US');
      ctx.addMessages(ftl`
        foo = Foo
            [trait] { "a" ->
                        [a] A
                        [b] B
                    }

        ref-foo = { foo[trait] }
      `);
    });

    it('can be referenced', function() {
      const msg = ctx.messages.get('ref-foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[[A]]`);
      assert.equal(errs.length, 0);
    });

    it('can be formatted directly', function() {
      const msg = ctx.messages.get('foo').traits[0];
      const val = ctx.format(msg, args, errs);
      assert.equal(val, bdi`[A]`);
      assert.equal(errs.length, 0);
    });
  });
});
