'use strict';

import assert from 'assert';

import FluentBundle from '../src/bundle';
import { ftl } from '../src/util';

suite('Select expressions', function() {
  let bundle, args, errs;

  setup(function() {
    errs = [];
  });

  suite('with a matching selector', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = { "a" ->
            [a] A
           *[b] B
        }
      `);
    });

    test('selects the variant matching the selector', function() {
      const val = bundle.format('foo', args, errs);
      assert.equal(val, 'A');
      assert.equal(errs.length, 0);
    });
  });

  suite('with a valid non-matching selector', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = { "c" ->
           *[a] A
            [b] B
        }
      `);
    });

    test('selects the default variant', function() {
      const val = bundle.format('foo', args, errs);
      assert.equal(val, 'A');
      assert.equal(errs.length, 0);
    });
  });

  suite('with a missing selector', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = { $none ->
           *[a] A
            [b] B
        }
      `);
    });

    test('selects the default variant', function() {
      const val = bundle.format('foo', args, errs);
      assert.equal(val, 'A');
      assert.equal(errs.length, 1);
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });
  });

  suite('with a number selector', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = { 1 ->
           *[0] A
            [1] B
        }

        bar = { 2 ->
           *[0] A
            [1] B
        }
      `);
    });

    test('selects the right variant', function() {
      const val = bundle.format('foo', args, errs);
      assert.equal(val, 'B');
    });

    test('selects the default variant', function() {
      const val = bundle.format('bar', args, errs);
      assert.equal(val, 'A');
    });
  });

  suite('with a number selector and plural categories', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = { 1 ->
           *[one] A
            [other] B
        }

        bar = { 1 ->
           *[1] A
            [other] B
        }
      `);
    });

    test('selects the right category', function() {
      const val = bundle.format('foo', args, errs);
      assert.equal(val, 'A');
    });

    test('selects the exact match', function() {
      const val = bundle.format('bar', args, errs);
      assert.equal(val, 'A');
    });
  });
});
