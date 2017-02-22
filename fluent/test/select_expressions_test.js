'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from './util';

describe('Select expressions', function() {
  let ctx, args, errs;

  beforeEach(function() {
    errs = [];
  });

  describe('with a matching selector', function(){
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

  describe('with a valid non-matching selector', function(){
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

  describe('with an invalid selector', function(){
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
      assert(errs[0] instanceof ReferenceError); // unknown message
    });
  });
});
