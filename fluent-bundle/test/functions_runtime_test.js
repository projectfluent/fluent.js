'use strict';

import assert from 'assert';
import ftl from "@fluent/dedent";

import {FluentBundle} from '../esm/bundle';
import {FluentResource} from '../esm/resource';

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
      bundle.addResource(new FluentResource(ftl`
        foo = { CONCAT("Foo", "Bar") }
        bar = { SUM(1, 2) }
        `));
    });

    test('works for strings', function() {
      const msg = bundle.getMessage('foo');
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, 'FooBar');
      assert.strictEqual(errs.length, 0);
    });

    // XXX When they are passed as variables, convert JS types to FTL types
    // https://bugzil.la/1307116
    test.skip('works for numbers', function() {
      const msg = bundle.getMessage('bar');
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, '3');
      assert.strictEqual(errs.length, 0);
    });
  });
});
