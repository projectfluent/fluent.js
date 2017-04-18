'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from './util';

suite('Context', function() {
  let ctx, args, errs;

  setup(function() {
    errs = [];
  });

  suite('addMessages', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
        bar = Bar
      `);
    });

    test('preserves existing messages when new are added', function() {
      ctx.addMessages(ftl`
        baz = Baz
      `);
      assert(ctx.hasMessage('foo'));
      assert(ctx.hasMessage('bar'));
      assert(ctx.hasMessage('baz'));
    });

    test('overwrites existing messages if the ids are the same', function() {
      ctx.addMessages(ftl`
        foo = New Foo
      `);
      assert(ctx.hasMessage('foo'));
      assert(ctx.hasMessage('bar'));
      assert(ctx.hasMessage('baz'));
      assert.equal(ctx._messages.size, 3);

      const msg = ctx.getMessage('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'New Foo');
      assert.equal(errs.length, 0);
    });
  });

});
