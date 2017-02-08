'use strict';

import assert from 'assert';

import { MessageContext } from '../../src/intl/context';
import { ftl } from '../util';

describe('Formatting values', function(){
  let ctx, args, errs;

  before(function() {
    ctx = new MessageContext('en-US', { useIsolating: false });
    ctx.addMessages(ftl`
      key1 = Value 1
      key2 = {
          [a] A2
         *[b] B2
      }
      key3 = Value { 3 }
      key4 = {
          [a] A{ 4 }
         *[b] B{ 4 }
      }
      key5
          .a = A5
          .b = B5
    `);
  });

  beforeEach(function() {
    errs = [];
  });

  it('returns the value', function(){
    const msg = ctx.messages.get('key1');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, 'Value 1');
    assert.equal(errs.length, 0);
  });

  it('returns the default variant', function(){
    const msg = ctx.messages.get('key2');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, 'B2');
    assert.equal(errs.length, 0);
  });

  it('returns the value if it is a pattern', function(){
    const msg = ctx.messages.get('key3');
    const val = ctx.format(msg, args, errs)
    assert.strictEqual(val, 'Value 3');
    assert.equal(errs.length, 0);
  });

  it('returns the default variant if it is a pattern', function(){
    const msg = ctx.messages.get('key4');
    const val = ctx.format(msg, args, errs)
    assert.strictEqual(val, 'B4');
    assert.equal(errs.length, 0);
  });

  it('returns null if there is no value', function(){
    const msg = ctx.messages.get('key5');
    const val = ctx.format(msg, args, errs);
    assert.strictEqual(val, null);
    assert.equal(errs.length, 0);
  });

  it('allows to pass traits directly to ctx.format', function(){
    const msg = ctx.messages.get('key5');
    assert.strictEqual(ctx.format(msg.attrs.a, args, errs), 'A5');
    assert.strictEqual(ctx.format(msg.attrs.b, args, errs), 'B5');
    assert.equal(errs.length, 0);
  });


});
