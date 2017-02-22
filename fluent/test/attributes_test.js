'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from './util';

describe('Attributes', function() {
  let ctx, args, errs;

  beforeEach(function() {
    errs = [];
  });

  describe('missing', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
        bar = Bar
            .attr = Bar Attribute
        baz = { foo } Baz
        qux = { foo } Qux
            .attr = Qux Attribute

        ref-foo = { foo.missing }
        ref-bar = { bar.missing }
        ref-baz = { baz.missing }
        ref-qux = { qux.missing }
      `);
    });

    it('falls back gracefully for entities with string values and no attributes', function() {
      const msg = ctx.messages.get('ref-foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo');
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown attribute
    });

    it('falls back gracefully for entities with string values and other attributes', function() {
      const msg = ctx.messages.get('ref-bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Bar');
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown attribute
    });

    it('falls back gracefully for entities with pattern values and no attributes', function() {
      const msg = ctx.messages.get('ref-baz');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Baz');
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown attribute
    });

    it('falls back gracefully for entities with pattern values and other attributes', function() {
      const msg = ctx.messages.get('ref-qux');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Qux');
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown attribute
    });
  });

  describe('with string values', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
            .attr = Foo Attribute
        bar = { foo } Bar
            .attr = Bar Attribute

        ref-foo = { foo.attr }
        ref-bar = { bar.attr }
      `);
    });

    it('can be referenced for entities with string values', function() {
      const msg = ctx.messages.get('ref-foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Attribute');
      assert.equal(errs.length, 0);
    });

    it('can be formatted directly for entities with string values', function() {
      const msg = ctx.messages.get('foo').attrs.attr;
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Attribute');
      assert.equal(errs.length, 0);
    });

    it('can be referenced for entities with pattern values', function() {
      const msg = ctx.messages.get('ref-bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Bar Attribute');
      assert.equal(errs.length, 0);
    });

    it('can be formatted directly for entities with pattern values', function() {
      const msg = ctx.messages.get('bar').attrs.attr;
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Bar Attribute');
      assert.equal(errs.length, 0);
    });
  });

  describe('with simple pattern values', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
        bar = Bar
            .attr = { foo } Attribute
        baz = { foo } Baz
            .attr = { foo } Attribute
        qux = Qux
            .attr = { qux } Attribute

        ref-bar = { bar.attr }
        ref-baz = { baz.attr }
        ref-qux = { qux.attr }
      `);
    });

    it('can be referenced for entities with string values', function() {
      const msg = ctx.messages.get('ref-bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Attribute');
      assert.equal(errs.length, 0);
    });

    it('can be formatted directly for entities with string values', function() {
      const msg = ctx.messages.get('bar').attrs.attr;
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Attribute');
      assert.equal(errs.length, 0);
    });

    it('can be referenced for entities with simple pattern values', function() {
      const msg = ctx.messages.get('ref-baz');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Attribute');
      assert.equal(errs.length, 0);
    });

    it('can be formatted directly for entities with simple pattern values', function() {
      const msg = ctx.messages.get('baz').attrs.attr;
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo Attribute');
      assert.equal(errs.length, 0);
    });

    it('works with self-references', function() {
      const msg = ctx.messages.get('ref-qux');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Qux Attribute');
      assert.equal(errs.length, 0);
    });

    it('can be formatted directly when it uses a self-reference', function() {
      const msg = ctx.messages.get('qux').attrs.attr;
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Qux Attribute');
      assert.equal(errs.length, 0);
    });
  });

  describe('with values with select expressions', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
            .attr = { "a" ->
                        [a] A
                       *[b] B
                    }

        ref-foo = { foo.attr }
      `);
    });

    it('can be referenced', function() {
      const msg = ctx.messages.get('ref-foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'A');
      assert.equal(errs.length, 0);
    });

    it('can be formatted directly', function() {
      const msg = ctx.messages.get('foo').attrs.attr;
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'A');
      assert.equal(errs.length, 0);
    });
  });
});
