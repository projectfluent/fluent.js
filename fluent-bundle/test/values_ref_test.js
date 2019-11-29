'use strict';

import assert from 'assert';
import ftl from "@fluent/dedent";

import {FluentBundle} from '../esm/bundle';
import {FluentResource} from '../esm/resource';

suite('Referencing values', function(){
  let bundle, args, errs;

  suiteSetup(function() {
    bundle = new FluentBundle('en-US', { useIsolating: false });
    bundle.addResource(new FluentResource(ftl`
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
      ref12 = { key5.c }

      ref13 = { key6 }
      ref14 = { key6.a }

      ref15 = { -key6 }
      ref16 = { -key6.a ->
          *[a] A
      }
      `));
  });

  setup(function() {
    errs = [];
  });

  test('references the value', function(){
    const msg = bundle.getMessage('ref1');
    const val = bundle.formatPattern(msg.value, args, errs);
    assert.strictEqual(val, 'Value 1');
    assert.strictEqual(errs.length, 0);
  });

  test('references the default variant', function(){
    const msg = bundle.getMessage('ref2');
    const val = bundle.formatPattern(msg.value, args, errs);
    assert.strictEqual(val, 'B2');
    assert.strictEqual(errs.length, 0);
  });

  test('references the value if it is a pattern', function(){
    const msg = bundle.getMessage('ref3');
    const val = bundle.formatPattern(msg.value, args, errs);
    assert.strictEqual(val, 'Value 3');
    assert.strictEqual(errs.length, 0);
  });

  test('references the default variant if it is a pattern', function(){
    const msg = bundle.getMessage('ref4');
    const val = bundle.formatPattern(msg.value, args, errs);
    assert.strictEqual(val, 'B4');
    assert.strictEqual(errs.length, 0);
  });

  test('falls back to id if there is no value', function(){
    const msg = bundle.getMessage('ref5');
    const val = bundle.formatPattern(msg.value, args, errs);
    assert.strictEqual(val, '{key5}');
    assert.ok(errs[0] instanceof ReferenceError); // no value
  });

  test('references the variants', function(){
    const msg_a = bundle.getMessage('ref6');
    const msg_b = bundle.getMessage('ref7');
    const val_a = bundle.formatPattern(msg_a.value, args, errs)
    const val_b = bundle.formatPattern(msg_b.value, args, errs)
    assert.strictEqual(val_a, 'A2');
    assert.strictEqual(val_b, 'B2');
    assert.strictEqual(errs.length, 0);
  });

  test('references the variants which are patterns', function(){
    const msg_a = bundle.getMessage('ref8');
    const msg_b = bundle.getMessage('ref9');
    const val_a = bundle.formatPattern(msg_a.value, args, errs)
    const val_b = bundle.formatPattern(msg_b.value, args, errs)
    assert.strictEqual(val_a, 'A4');
    assert.strictEqual(val_b, 'B4');
    assert.strictEqual(errs.length, 0);
  });

  test('references the attributes', function(){
    const msg_a = bundle.getMessage('ref10');
    const msg_b = bundle.getMessage('ref11');
    const msg_c = bundle.getMessage('ref12');
    const val_a = bundle.formatPattern(msg_a.value, args, errs)
    const val_b = bundle.formatPattern(msg_b.value, args, errs)
    const val_c = bundle.formatPattern(msg_c.value, args, errs)
    assert.strictEqual(val_a, 'A5');
    assert.strictEqual(val_b, 'B5');
    assert.strictEqual(val_c, '{key5.c}');
    assert.strictEqual(errs.length, 1);
  });

  test('missing message reference', function(){
    const msg_a = bundle.getMessage('ref13');
    const msg_b = bundle.getMessage('ref14');
    const val_a = bundle.formatPattern(msg_a.value, args, errs)
    const val_b = bundle.formatPattern(msg_b.value, args, errs)
    assert.strictEqual(val_a, '{key6}');
    assert.strictEqual(val_b, '{key6}');
    assert.strictEqual(errs.length, 2);
  });

  test('missing term reference', function(){
    const msg_a = bundle.getMessage('ref15');
    const msg_b = bundle.getMessage('ref16');
    const val_a = bundle.formatPattern(msg_a.value, args, errs)
    const val_b = bundle.formatPattern(msg_b.value, args, errs)
    assert.strictEqual(val_a, '{-key6}');
    assert.strictEqual(val_b, 'A');
    assert.strictEqual(errs.length, 2);
  });

});
