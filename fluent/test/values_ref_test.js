'use strict';

import assert from 'assert';

import FluentBundle from '../src/bundle';
import { ftl } from '../src/util';

suite('Referencing values', function(){
  let bundle, args, errs;

  suiteSetup(function() {
    bundle = new FluentBundle('en-US', { useIsolating: false });
    bundle.addMessages(ftl`
      key1 = Value 1
      -key2 = { $sel ->
          [a] A2
         *[b] B2
      }
      key3 = Value { 3 }
      -key4 = { $sel ->
          [a] A{ 4 }
         *[b] B{ 4 }
      }
      key5 =
          .a = A5
          .b = B5

      ref1 = { key1 }
      ref2 = { -key2 }
      ref3 = { key3 }
      ref4 = { -key4 }
      ref5 = { key5 }

      ref6 = { -key2(sel: "a") }
      ref7 = { -key2(sel: "b") }

      ref8 = { -key4(sel: "a") }
      ref9 = { -key4(sel: "b") }

      ref10 = { key5.a }
      ref11 = { key5.b }
    `);
  });

  setup(function() {
    errs = [];
  });

  test('references the value', function(){
    const val = bundle.format('ref1', args, errs);
    assert.equal(val, 'Value 1');
    assert.equal(errs.length, 0);
  });

  test('references the default variant', function(){
    const val = bundle.format('ref2', args, errs);
    assert.equal(val, 'B2');
    assert.equal(errs.length, 0);
  });

  test('references the value if it is a pattern', function(){
    const val = bundle.format('ref3', args, errs);
    assert.equal(val, 'Value 3');
    assert.equal(errs.length, 0);
  });

  test('references the default variant if it is a pattern', function(){
    const val = bundle.format('ref4', args, errs);
    assert.equal(val, 'B4');
    assert.equal(errs.length, 0);
  });

  test('uses ??? if there is no value', function(){
    const val = bundle.format('ref5', args, errs);
    assert.strictEqual(val, 'key5');
    assert.ok(errs[0] instanceof RangeError); // no default
  });

  test('references the variants', function(){
    const val_a = bundle.format('ref6', args, errs)
    const val_b = bundle.format('ref7', args, errs)
    assert.strictEqual(val_a, 'A2');
    assert.strictEqual(val_b, 'B2');
    assert.equal(errs.length, 0);
  });

  test('references the variants which are patterns', function(){
    const val_a = bundle.format('ref8', args, errs)
    const val_b = bundle.format('ref9', args, errs)
    assert.strictEqual(val_a, 'A4');
    assert.strictEqual(val_b, 'B4');
    assert.equal(errs.length, 0);
  });

  test('references the attributes', function(){
    const val_a = bundle.format('ref10', args, errs)
    const val_b = bundle.format('ref11', args, errs)
    assert.strictEqual(val_a, 'A5');
    assert.strictEqual(val_b, 'B5');
    assert.equal(errs.length, 0);
  });

});
