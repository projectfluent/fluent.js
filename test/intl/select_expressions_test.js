'use strict';

import assert from 'assert';

import { MessageContext } from '../../src/intl/context';
import { ftl } from '../util';

describe('Select expressions', function() {
  let ctx, args, errs;

  beforeEach(function() {
    errs = [];
  });

  describe('with a matching selector and no default variant', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { "a" ->
            [a] A
            [b] B
        }
      `);
    });

    it('selects the variant matching the selector', function() {
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'A');
      assert.equal(errs.length, 0);
    });
  });

  describe('with a matching selector and a default variant', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { "a" ->
            [a] A
           *[b] B
        }
      `);
    });

    it('selects the variant matching the selector', function() {
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'A');
      assert.equal(errs.length, 0);
    });
  });

  describe('with a valid non-matching selector and no default variant', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { "c" ->
            [a] A
            [b] B
        }
      `);
    });

    it('formats to ???', function() {
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, '???');
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof RangeError); // no default
    });
  });

  describe('with a valid non-matching selector and a default variant', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { "c" ->
           *[a] A
            [b] B
        }
      `);
    });

    it('selects the default variant', function() {
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'A');
      assert.equal(errs.length, 0);
    });
  });

  describe('with an invalid selector and no default variant', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { bar ->
            [a] A
            [b] B
        }
      `);
    });

    it('formats ???', function() {
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, '???');
      assert.equal(errs.length, 2);
      assert(errs[0] instanceof ReferenceError); // unknown entity
      assert(errs[1] instanceof RangeError); // no default
    });
  });

  describe('with an invalid selector and a default variant', function(){
    before(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { bar ->
           *[a] A
            [b] B
        }
      `);
    });

    it('selects the default variant', function() {
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'A');
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown entity
    });
  });
});
