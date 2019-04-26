'use strict';

import assert from 'assert';

import FluentBundle from '../src/bundle';
import { ftl } from '../src/util';

suite('Runtime-specific functions', function() {
  let bundle, args, errs;

  setup(function() {
    errs = [];
  });

  suite('passing into the constructor', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', {
        useIsolating: false,
        functions: {
          CONCAT: (args, kwargs) => args.reduce((a, b) => `${a}${b}`, ''),
          SUM: (args, kwargs) => args.reduce((a, b) => a + b, 0)
        }
      });
      bundle.addMessages(ftl`
        foo = { CONCAT("Foo", "Bar") }
        bar = { SUM(1, 2) }
      `);
    });

    test('works for strings', function() {
      const val = bundle.format('foo', args, errs);
      assert.equal(val, 'FooBar');
      assert.equal(errs.length, 0);
    });

    // XXX When they are passed as variables, convert JS types to FTL types
    // https://bugzil.la/1307116
    test.skip('works for numbers', function() {
      const val = bundle.format('bar', args, errs);
      assert.equal(val, '3');
      assert.equal(errs.length, 0);
    });
  });
});
