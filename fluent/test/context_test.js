'use strict';

import assert from 'assert';

import FluentBundle from '../src/context';
import FluentResource from '../src/resource';
import { ftl } from '../src/util';

suite('Bundle', function() {
  let bundle, args, errs;

  setup(function() {
    errs = [];
  });

  suite('addMessages', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = Foo
        -bar = Private Bar
      `);
    });

    test('adds messages', function() {
      assert.equal(bundle._messages.has('foo'), true);
      assert.equal(bundle._terms.has('foo'), false);
      assert.equal(bundle._messages.has('-bar'), false);
      assert.equal(bundle._terms.has('-bar'), true);
    });

    test('preserves existing messages when new are added', function() {
      bundle.addMessages(ftl`
        baz = Baz
      `);

      assert.equal(bundle._messages.has('foo'), true);
      assert.equal(bundle._terms.has('foo'), false);
      assert.equal(bundle._messages.has('-bar'), false);
      assert.equal(bundle._terms.has('-bar'), true);

      assert.equal(bundle._messages.has('baz'), true);
      assert.equal(bundle._terms.has('baz'), false);
    });

    test('messages and terms can share the same name', function() {
      bundle.addMessages(ftl`
        -foo = Private Foo
      `);
      assert.equal(bundle._messages.has('foo'), true);
      assert.equal(bundle._terms.has('foo'), false);
      assert.equal(bundle._messages.has('-foo'), false);
      assert.equal(bundle._terms.has('-foo'), true);
    });


    test('does not overwrite existing messages if the ids are the same', function() {
      const errors = bundle.addMessages(ftl`
        foo = New Foo
      `);

      // Attempt to overwrite error reported
      assert.equal(errors.length, 1);

      assert.equal(bundle._messages.size, 2);

      const msg = bundle.getMessage('foo');
      const val = bundle.format(msg, args, errs);
      assert.equal(val, 'Foo');
      assert.equal(errs.length, 0);
    });
  });

  suite('addResource', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      let resource = FluentResource.fromString(ftl`
        foo = Foo
        -bar = Bar
      `);
      bundle.addResource(resource);
    });

    test('adds messages', function() {
      assert.equal(bundle._messages.has('foo'), true);
      assert.equal(bundle._terms.has('foo'), false);
      assert.equal(bundle._messages.has('-bar'), false);
      assert.equal(bundle._terms.has('-bar'), true);
    });
  });

  suite('hasMessage', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = Foo
        -bar = Bar
      `);
    });

    test('returns true only for public messages', function() {
      assert.equal(bundle.hasMessage('foo'), true);
    });

    test('returns false for terms and missing messages', function() {
      assert.equal(bundle.hasMessage('-bar'), false);
      assert.equal(bundle.hasMessage('baz'), false);
      assert.equal(bundle.hasMessage('-baz'), false);
    });
  });

  suite('getMessage', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = Foo
        -bar = Bar
      `);
    });

    test('returns public messages', function() {
      assert.equal(bundle.getMessage('foo'), 'Foo');
    });

    test('returns null for terms and missing messages', function() {
      assert.equal(bundle.getMessage('-bar'), null);
      assert.equal(bundle.getMessage('baz'), null);
      assert.equal(bundle.getMessage('-baz'), null);
    });
  });

});
