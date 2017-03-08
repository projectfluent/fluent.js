'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from './util';

suite('Tags', function() {
  let ctx, args, errs;

  suiteSetup(function() {
    ctx = new MessageContext('en-US', { useIsolating: false });
    ctx.addMessages(ftl`
      foo = Foo
          #tag

      bar = Bar
          #tag1
          #tag2

      baz = Baz

      ref-foo =
          { foo ->
              [tag] Foo Tag
             *[other] Other
          }

      ref-bar-1 =
          { bar ->
              [tag1] Bar Tag 1
             *[other] Other
          }

      ref-bar-2 =
          { bar ->
              [tag2] Bar Tag 2
              [tag1] Bar Tag 1 
             *[other] Other
          }

      ref-baz =
          { baz ->
              [missing] Baz Missing Tag
             *[other] Other
          }
    `);
  });

  setup(function() {
    errs = [];
  });

  test('match in a message', function() {
    const msg = ctx.messages.get('ref-foo');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, 'Foo Tag');
    assert.equal(errs.length, 0);
  });

  test('match one of two', function() {
    const msg = ctx.messages.get('ref-bar-1');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, 'Bar Tag 1');
    assert.equal(errs.length, 0);
  });

  test('match in order of variants', function() {
    const msg = ctx.messages.get('ref-bar-2');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, 'Bar Tag 2');
    assert.equal(errs.length, 0);
  });

  test('fallback when tag is missing', function() {
    const msg = ctx.messages.get('ref-baz');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, 'Other');
    assert.equal(errs.length, 1);
    assert.ok(errs[0] instanceof RangeError); // no tags
  });
});
