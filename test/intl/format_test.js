'use strict';

import assert from 'assert';

import { MessageContext } from '../../src/intl/context';
import { ftl, bdi } from '../util';

describe('Formatting values', function(){
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
    `);
  });

  beforeEach(function() {
    errs = [];
  });

  it('uses the value when no traits are defined', function(){
    const msg = ctx.messages.get('key1');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, 'Value 1');
    assert.deepEqual(errs, []);
  });

  it('uses the value even if traits are defined', function(){
    const msg = ctx.messages.get('key2');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, 'Value 2');
    assert.deepEqual(errs, []);
  });

  it('uses the value even if one trait is marked as default', function(){
    const msg = ctx.messages.get('key3');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, 'Value 3');
    assert.deepEqual(errs, []);
  });

  it('uses the default trait if there is no value', function(){
    const msg = ctx.messages.get('key4');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, 'B4');
    assert.deepEqual(errs, []);
  });

  it('returns null if there is no value and no default', function(){
    const msg = ctx.messages.get('key5');
    const val = ctx.format(msg, args, errs);
    assert.strictEqual(val, null);
    assert.deepEqual(errs, []);
  });

  it('allows to pass traits directly to ctx.format', function(){
    const msg = ctx.messages.get('key2');
    const vals = msg.traits.map(
      trait => ctx.format(trait, args, errs)
    );
    assert.deepEqual(vals, ['A2', 'B2']);
    assert.deepEqual(errs, []);
  });

  it('returns the value if it is a pattern', function(){
    const msg = ctx.messages.get('key6');
    const val = ctx.format(msg, args, errs)
    assert.strictEqual(val, bdi`Value [6]`);
    assert.deepEqual(errs, []);
  });

  it('returns trait values if they are patterns', function(){
    const msg = ctx.messages.get('key7');
    const vals = msg.traits.map(
      trait => ctx.format(trait, args, errs)
    );
    assert.deepEqual(vals, [bdi`A[7]`, bdi`B[7]`]);
    assert.deepEqual(errs, []);
  });

});
