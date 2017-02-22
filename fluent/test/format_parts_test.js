'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { FluentNone, FluentNumber } from '../src/types';
import { ftl } from './util';

function partsEqual(actual, expected) {
  if (actual === null && expected === null) {
    return true;
  }

  if (!Array.isArray(actual) || !Array.isArray(expected)) {
    return false;
  }

  return actual.every((actu, i) => {
    const expt = expected[i];
    const sameType =
      typeof actu === typeof expt === 'string' ||
      actu.constructor === expt.constructor;
    const sameValue = actu.value === expt.value;
    return sameType && sameValue;
  });
}

function assert_partsEqual(actual, expected) {
  if (!partsEqual(actual, expected)) {
    assert.fail(actual, expected, null, 'partsEqual');
  }
}

describe('formatToParts', function(){
  let ctx, args, errs;

  beforeEach(function() {
    errs = [];
  });

  describe('Simple value', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
      `);
    });

    it('returns the parts', function(){
      const msg = ctx.messages.get('foo');
      const val = ctx.formatToParts(msg, args, errs);
      assert_partsEqual(val, ['Foo']);
      assert.equal(errs.length, 0);
    });
  });

  describe('Complex value', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
        bar = { foo } Bar
        baz = { missing }
        qux = { 1 }
      `);
    });

    it('returns the parts', function(){
      const msg = ctx.messages.get('bar');
      const val = ctx.formatToParts(msg, args, errs);
      assert_partsEqual(val, ['Foo', ' Bar']);
      assert.equal(errs.length, 0);
    });

    it('returns FluentNone', function(){
      const msg = ctx.messages.get('baz');
      const val = ctx.formatToParts(msg, args, errs);
      assert_partsEqual(val, [new FluentNone('missing')]);
      assert.ok(errs[0] instanceof ReferenceError); // unknown message
    });

    it('returns FluentNumber', function(){
      const msg = ctx.messages.get('qux');
      const val = ctx.formatToParts(msg, args, errs);
      assert_partsEqual(val, [new FluentNumber(1)]);
      assert.equal(errs.length, 0);
    });
  });

  describe('Complex value referencing a null message', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo
            .attr = Foo Attr
        bar = { foo } Bar
      `);
    });

    it('returns null', function(){
      const msg = ctx.messages.get('foo');
      const val = ctx.formatToParts(msg, args, errs);
      assert_partsEqual(val, null);
      assert.equal(errs.length, 0);
    });

    it('returns the parts of the attribute', function(){
      const msg = ctx.messages.get('foo');
      const val = ctx.formatToParts(msg.attrs.attr, args, errs);
      assert_partsEqual(val, ['Foo Attr']);
      assert.equal(errs.length, 0);
    });

    it('returns FluentNone', function(){
      const msg = ctx.messages.get('bar');
      const val = ctx.formatToParts(msg, args, errs);
      assert_partsEqual(val, [new FluentNone(), ' Bar']);
      assert.ok(errs[0] instanceof RangeError); // no default
    });
  });

  describe('Nested complex values', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo { 1 }
        bar = { foo } Bar
        baz = { bar } Baz
      `);
    });

    it('returns parts of foo', function(){
      const msg = ctx.messages.get('foo');
      const val = ctx.formatToParts(msg, args, errs);
      assert_partsEqual(val, ['Foo', new FluentNumber(1)]);
      assert.equal(errs.length, 0);
    });

    it('returns flattened parts of bar', function(){
      const msg = ctx.messages.get('bar');
      const val = ctx.formatToParts(msg, args, errs);
      assert_partsEqual(val, ['Foo', new FluentNumber(1), 'Bar']);
      assert.equal(errs.length, 0);
    });

    it('returns flattened parts of baz', function(){
      const msg = ctx.messages.get('baz');
      const val = ctx.formatToParts(msg, args, errs);
      assert_partsEqual(val, ['Foo', new FluentNumber(1), ' Bar', ' Baz']);
      assert.equal(errs.length, 0);
    });

  });
});
