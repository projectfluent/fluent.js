'use strict';

import assert from 'assert';

import FluentBundle from '../src/bundle';
import { FluentType } from '../src/types';
import { ftl } from '../src/util';

suite('Variables', function() {
  let bundle, errs;

  setup(function() {
    errs = [];
  });

  suite('in values', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = Foo { $num }
        bar = { foo }
        baz =
            .attr = Baz Attribute { $num }
        qux = { "a" ->
           *[a]     Baz Variant A { $num }
        }
      `);
    });

    test('can be used in the message value', function() {
      const val = bundle.format('foo', { num: 3 }, errs);
      assert.equal(val, 'Foo 3');
      assert.equal(errs.length, 0);
    });

    test('can be used in the message value which is referenced', function() {
      const val = bundle.format('bar', { num: 3 }, errs);
      assert.equal(val, 'Foo 3');
      assert.equal(errs.length, 0);
    });

    test('can be used in an attribute', function() {
      const message = bundle.getMessage('baz');
      const val = bundle.formatAttribute(message, 'attr', { num: 3 }, errs);
      assert.equal(val, 'Baz Attribute 3');
      assert.equal(errs.length, 0);
    });

    test('can be used in a variant', function() {
      const val = bundle.format('qux', { num: 3 }, errs);
      assert.equal(val, 'Baz Variant A 3');
      assert.equal(errs.length, 0);
    });
  });

  suite('in selectors', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = { $num -> 
           *[3] Foo
        }
      `);
    });

    test('can be used as a selector', function() {
      const val = bundle.format('foo', { num: 3 }, errs);
      assert.equal(val, 'Foo');
      assert.equal(errs.length, 0);
    });
  });

  suite('in function calls', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = { NUMBER($num) }
      `);
    });

    test('can be a positional argument', function() {
      const val = bundle.format('foo', { num: 3 }, errs);
      assert.equal(val, '3');
      assert.equal(errs.length, 0);
    });
  });

  suite('simple errors', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = { $arg }
      `);
    });

    test('falls back to argument\'s name if it\'s missing', function() {
      const val = bundle.format('foo', {}, errs);
      assert.equal(val, '$arg');
      assert(errs[0] instanceof ReferenceError); // unknown variable
    });

    test('cannot be arrays', function() {
      const val = bundle.format('foo', { arg: [1, 2, 3] }, errs);
      assert.equal(val, '$arg');
      assert(errs[0] instanceof TypeError); // unsupported variable type
    });

    test('cannot be a dict-like object', function() {
      const val = bundle.format('foo', { arg: { prop: 1 } }, errs);
      assert.equal(val, '$arg');
      assert(errs[0] instanceof TypeError); // unsupported variable type
    });

    test('cannot be a boolean', function() {
      const val = bundle.format('foo', { arg: true }, errs);
      assert.equal(val, '$arg');
      assert(errs[0] instanceof TypeError); // unsupported variable type
    });

    test('cannot be undefined', function() {
      const val = bundle.format('foo', { arg: undefined }, errs);
      assert.equal(val, '$arg');
      assert(errs[0] instanceof TypeError); // unsupported variable type
    });

    test('cannot be null', function() {
      const val = bundle.format('foo', { arg: null }, errs);
      assert.equal(val, '$arg');
      assert(errs[0] instanceof TypeError); // unsupported variable type
    });

    test('cannot be a function', function() {
      const val = bundle.format('foo', { arg: () => null }, errs);
      assert.equal(val, '$arg');
      assert(errs[0] instanceof TypeError); // unsupported variable type
    });
  });

  suite('and strings', function(){
    let args;

    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = { $arg }
      `);
      args = {
        arg: 'Argument',
      };
    });

    test('can be a string', function(){
      const val = bundle.format('foo', args, errs);
      assert.equal(val, 'Argument');
      assert.equal(errs.length, 0);
    });
  });

  suite('and numbers', function(){
    let args;

    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = { $arg }
      `);
      args = {
        arg: 1
      };
    });

    test('can be a number', function(){
      const val = bundle.format('foo', args, errs);
      assert.equal(val, '1');
      assert.equal(errs.length, 0);
    });
  });

  suite('and dates', function(){
    let args, dtf;

    suiteSetup(function() {
      dtf = new Intl.DateTimeFormat('en-US');
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = { $arg }
      `);
      args = {
        arg: new Date('2016-09-29')
      };
    });

    test('can be a date', function(){
      const val = bundle.format('foo', args, errs);
      // format the date argument to account for the testrunner's timezone
      assert.equal(val, dtf.format(args.arg));
      assert.equal(errs.length, 0);
    });
  });

  suite('custom argument types', function(){
    let argval, args;

    class CustomType extends FluentType {
      toString() {
        return 'CUSTOM';
      }
    }

    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        foo = { $arg }
        bar = { foo }
      `);

      args = {
        // CustomType is a wrapper around the value
        arg: new CustomType()
      };

      test('interpolation', function () {
        const value = bundle.format('foo', args, errs);
        assert.equal(value, 'CUSTOM');
        assert.equal(errs.length, 0);
      });

      test('nested interpolation', function () {
        const value = bundle.format('bar', args, errs);
        assert.equal(value, 'CUSTOM');
        assert.equal(errs.length, 0);
      });
    });
  });
});
