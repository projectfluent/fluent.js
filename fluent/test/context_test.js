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
        -bar = Private Bar
      `);
    });

    test('adds messages', function() {
      assert.equal(ctx._publicMessages.has('foo'), true);
      assert.equal(ctx._privateMessages.has('foo'), false);
      assert.equal(ctx._publicMessages.has('-bar'), false);
      assert.equal(ctx._privateMessages.has('-bar'), true);
    });

    test('preserves existing messages when new are added', function() {
      ctx.addMessages(ftl`
        baz = Baz
      `);

      assert.equal(ctx._publicMessages.has('foo'), true);
      assert.equal(ctx._privateMessages.has('foo'), false);
      assert.equal(ctx._publicMessages.has('-bar'), false);
      assert.equal(ctx._privateMessages.has('-bar'), true);

      assert.equal(ctx._publicMessages.has('baz'), true);
      assert.equal(ctx._privateMessages.has('baz'), false);
    });

    test('public and private can share the same name', function() {
      ctx.addMessages(ftl`
        -foo = Private Foo
      `);
      assert.equal(ctx._publicMessages.has('foo'), true);
      assert.equal(ctx._privateMessages.has('foo'), false);
      assert.equal(ctx._publicMessages.has('-foo'), false);
      assert.equal(ctx._privateMessages.has('-foo'), true);
    });


    test('overwrites existing messages if the ids are the same', function() {
      ctx.addMessages(ftl`
        foo = New Foo
      `);

      assert.equal(ctx._publicMessages.size, 2);

      const msg = ctx.getMessage('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'New Foo');
      assert.equal(errs.length, 0);
    });
  });

  suite('hasMessage', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = Foo
        -bar = Private Bar
      `);
    });

    test('returns true only for public messages', function() {
      assert.equal(ctx.hasMessage('foo'), true);
    });

    test('returns false for private and missing messages', function() {
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
        -bar = Private Bar
      `);
    });

    test('returns public messages', function() {
      assert.equal(ctx.getMessage('foo'), 'Foo');
    });

    test('returns null for private and missing messages', function() {
      assert.equal(ctx.getMessage('-bar'), null);
      assert.equal(ctx.getMessage('baz'), null);
      assert.equal(ctx.getMessage('-baz'), null);
    });
  });

});
