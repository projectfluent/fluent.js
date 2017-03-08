'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from './util';

suite('Referencing values', function(){
  let ctx, args, errs;

  suiteSetup(function() {
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

      ref1 = { key1 }
      ref2 = { key2 }
      ref3 = { key3 }
      ref4 = { key4 }
      ref5 = { key5 }

      ref6 = { key2[a] }
      ref7 = { key2[b] }

      ref8 = { key4[a] }
      ref9 = { key4[b] }

      ref10 = { key5.a }
      ref11 = { key5.b }
    `);
  });

  setup(function() {
    errs = [];
  });

  test('references the value', function(){
    const msg = ctx.messages.get('ref1');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, 'Value 1');
    assert.equal(errs.length, 0);
  });

  test('references the default variant', function(){
    const msg = ctx.messages.get('ref2');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, 'B2');
    assert.equal(errs.length, 0);
  });

  test('references the value if it is a pattern', function(){
    const msg = ctx.messages.get('ref3');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, 'Value 3');
    assert.equal(errs.length, 0);
  });

  test('references the default variant if it is a pattern', function(){
    const msg = ctx.messages.get('ref4');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, 'B4');
    assert.equal(errs.length, 0);
  });

  test('uses ??? if there is no value', function(){
    const msg = ctx.messages.get('ref5');
    const val = ctx.format(msg, args, errs);
    assert.strictEqual(val, '???');
    assert.ok(errs[0] instanceof RangeError); // no default
  });

  test('references the variants', function(){
    const msg_a = ctx.messages.get('ref6');
    const msg_b = ctx.messages.get('ref7');
    const val_a = ctx.format(msg_a, args, errs)
    const val_b = ctx.format(msg_b, args, errs)
    assert.strictEqual(val_a, 'A2');
    assert.strictEqual(val_b, 'B2');
    assert.equal(errs.length, 0);
  });

  test('references the variants which are patterns', function(){
    const msg_a = ctx.messages.get('ref8');
    const msg_b = ctx.messages.get('ref9');
    const val_a = ctx.format(msg_a, args, errs)
    const val_b = ctx.format(msg_b, args, errs)
    assert.strictEqual(val_a, 'A4');
    assert.strictEqual(val_b, 'B4');
    assert.equal(errs.length, 0);
  });

  test('references the attributes', function(){
    const msg_a = ctx.messages.get('ref10');
    const msg_b = ctx.messages.get('ref11');
    const val_a = ctx.format(msg_a, args, errs)
    const val_b = ctx.format(msg_b, args, errs)
    assert.strictEqual(val_a, 'A5');
    assert.strictEqual(val_b, 'B5');
    assert.equal(errs.length, 0);
  });

});
