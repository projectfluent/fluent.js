'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from '../src/util';

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
        -bar = Private Bar
      `);
    });

    test('adds messages', function() {
      assert.equal(ctx._messages.has('foo'), true);
      assert.equal(ctx._terms.has('foo'), false);
      assert.equal(ctx._messages.has('-bar'), false);
      assert.equal(ctx._terms.has('-bar'), true);
    });

    test('preserves existing messages when new are added', function() {
      ctx.addMessages(ftl`
        baz = Baz
      `);

      assert.equal(ctx._messages.has('foo'), true);
      assert.equal(ctx._terms.has('foo'), false);
      assert.equal(ctx._messages.has('-bar'), false);
      assert.equal(ctx._terms.has('-bar'), true);

      assert.equal(ctx._messages.has('baz'), true);
      assert.equal(ctx._terms.has('baz'), false);
    });

    test('messages and terms can share the same name', function() {
      ctx.addMessages(ftl`
        -foo = Private Foo
      `);
      assert.equal(ctx._messages.has('foo'), true);
      assert.equal(ctx._terms.has('foo'), false);
      assert.equal(ctx._messages.has('-foo'), false);
      assert.equal(ctx._terms.has('-foo'), true);
    });


    test('does not overwrite existing messages if the ids are the same', function() {
      const errors = ctx.addMessages(ftl`
        foo = New Foo
      `);

      // Attempt to overwrite error reported
      assert.equal(errors.length, 1);

      assert.equal(ctx._messages.size, 2);

      const msg = ctx.getMessage('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'Foo');
      assert.equal(errs.length, 0);
    });
  });

  suite('hasMessage', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
        -bar = Bar
      `);
    });

    test('returns true only for public messages', function() {
      assert.equal(ctx.hasMessage('foo'), true);
    });

    test('returns false for terms and missing messages', function() {
      assert.equal(ctx.hasMessage('-bar'), false);
      assert.equal(ctx.hasMessage('baz'), false);
      assert.equal(ctx.hasMessage('-baz'), false);
    });
  });

  suite('getMessage', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
        -bar = Bar
      `);
    });

    test('returns public messages', function() {
      assert.equal(ctx.getMessage('foo'), 'Foo');
    });

    test('returns null for terms and missing messages', function() {
      assert.equal(ctx.getMessage('-bar'), null);
      assert.equal(ctx.getMessage('baz'), null);
      assert.equal(ctx.getMessage('-baz'), null);
    });
  });

});
