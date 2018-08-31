'use strict';

import assert from 'assert';

import { FluentBundle } from '../src/context';
import { ftl } from '../src/util';

suite('Formatting values', function(){
  let bundle, args, errs;

  suiteSetup(function() {
    bundle = new FluentBundle('en-US', { useIsolating: false });
    bundle.addMessages(ftl`
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
      key5 =
          .a = A5
          .b = B5
    `);
  });

  setup(function() {
    errs = [];
  });

  test('returns the value', function(){
    const msg = bundle.getMessage('key1');
    const val = bundle.format(msg, args, errs);
    assert.equal(val, 'Value 1');
    assert.equal(errs.length, 0);
  });

  test('returns the default variant', function(){
    const msg = bundle.getMessage('key2');
    const val = bundle.format(msg, args, errs);
    assert.equal(val, 'B2');
    assert.equal(errs.length, 0);
  });

  test('returns the value if it is a pattern', function(){
    const msg = bundle.getMessage('key3');
    const val = bundle.format(msg, args, errs)
    assert.strictEqual(val, 'Value 3');
    assert.equal(errs.length, 0);
  });

  test('returns the default variant if it is a pattern', function(){
    const msg = bundle.getMessage('key4');
    const val = bundle.format(msg, args, errs)
    assert.strictEqual(val, 'B4');
    assert.equal(errs.length, 0);
  });

  test('returns null if there is no value', function(){
    const msg = bundle.getMessage('key5');
    const val = bundle.format(msg, args, errs);
    assert.strictEqual(val, null);
    assert.equal(errs.length, 0);
  });

  test('allows to pass traits directly to bundle.format', function(){
    const msg = bundle.getMessage('key5');
    assert.strictEqual(bundle.format(msg.attrs.a, args, errs), 'A5');
    assert.strictEqual(bundle.format(msg.attrs.b, args, errs), 'B5');
    assert.equal(errs.length, 0);
  });


});
