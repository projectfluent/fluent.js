'use strict';

import assert from 'assert';

import { MessageContext } from '../../src/intl/context';
import { ftl, bdi } from '../util';

describe('Referencing values', function(){
  let ctx, args, errs;

  before(function() {
    ctx = new MessageContext('en-US');
    ctx.addMessages(ftl`
      key1 = Value 1
      key2 = Value 2
          [a] A2
          [b] B2
      key3 = Value 3
          [a] A3
         *[b] B3
      key4 =
          [a] A4
         *[b] B4
      key5 =
          [a] A5
          [b] B5
      key6 = Value { 6 }
      key7 = Value { 7 }
          [a] A{ 7 }
          [b] B{ 7 }

      ref1 = { key1 }
      ref2 = { key2 }
      ref3 = { key3 }
      ref4 = { key4 }
      ref5 = { key5 }
      ref6 = { key6 }
      ref7 = { key7 }

      ref8 = { key2[a] }
      ref9 = { key2[b] }

      ref10 = { key3[a] }
      ref11 = { key3[b] }

      ref12 = { key7[a] }
      ref13 = { key7[b] }
    `);
  });

  beforeEach(function() {
    errs = [];
  });

  it('references the value when no traits are defined', function(){
    const msg = ctx.messages.get('ref1');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, bdi`[Value 1]`);
    assert.equal(errs.length, 0);
  });

  it('references the value even if traits are defined', function(){
    const msg = ctx.messages.get('ref2');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, bdi`[Value 2]`);
    assert.equal(errs.length, 0);
  });

  it('references the value even if one trait is marked as default', function(){
    const msg = ctx.messages.get('ref3');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, bdi`[Value 3]`);
    assert.equal(errs.length, 0);
  });

  it('references the default trait if there is no value', function(){
    const msg = ctx.messages.get('ref4');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, bdi`[B4]`);
    assert.equal(errs.length, 0);
  });

  it('uses ??? if there is no value and no default', function(){
    const msg = ctx.messages.get('ref5');
    const val = ctx.format(msg, args, errs);
    assert.strictEqual(val, bdi`[???]`);
    assert.ok(errs[0] instanceof RangeError); // no default
  });

  it('references the value if it is a pattern', function(){
    const msg = ctx.messages.get('ref6');
    const val = ctx.format(msg, args, errs)
    assert.strictEqual(val, bdi`[Value [6]]`);
    assert.equal(errs.length, 0);
  });

  it('references the value if it is a pattern and there are traits', function(){
    const msg = ctx.messages.get('ref7');
    const val = ctx.format(msg, args, errs)
    assert.strictEqual(val, bdi`[Value [7]]`);
    assert.equal(errs.length, 0);
  });

  it('references the traits if none is the default', function(){
    const msg_a = ctx.messages.get('ref8');
    const msg_b = ctx.messages.get('ref9');
    const val_a = ctx.format(msg_a, args, errs)
    const val_b = ctx.format(msg_b, args, errs)
    assert.strictEqual(val_a, bdi`[A2]`);
    assert.strictEqual(val_b, bdi`[B2]`);
    assert.equal(errs.length, 0);
  });

  it('references the traits if one of them is the default', function(){
    const msg_a = ctx.messages.get('ref10');
    const msg_b = ctx.messages.get('ref11');
    const val_a = ctx.format(msg_a, args, errs)
    const val_b = ctx.format(msg_b, args, errs)
    assert.strictEqual(val_a, bdi`[A3]`);
    assert.strictEqual(val_b, bdi`[B3]`);
    assert.equal(errs.length, 0);
  });

  it('references the traits if they are patterns', function(){
    const msg_a = ctx.messages.get('ref12');
    const msg_b = ctx.messages.get('ref13');
    const val_a = ctx.format(msg_a, args, errs)
    const val_b = ctx.format(msg_b, args, errs)
    assert.strictEqual(val_a, bdi`[A[7]]`);
    assert.strictEqual(val_b, bdi`[B[7]]`);
    assert.equal(errs.length, 0);
  });

});
