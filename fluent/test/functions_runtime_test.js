'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from './util';

suite('Runtime-specific functions', function() {
  let ctx, args, errs;

  setup(function() {
    errs = [];
  });

  suite('passing into the constructor', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', {
        useIsolating: false,
        functions: {
          CONCAT: (args, kwargs) => args.reduce((a, b) => `${a}${b}`, ''),
          SUM: (args, kwargs) => args.reduce((a, b) => a + b, 0)
        }
      });
      ctx.addMessages(ftl`
        foo = { CONCAT("Foo", "Bar") }
        bar = { SUM(1, 2) }
      `);
    });

    test('works for strings', function() {
      const msg = ctx.getMessage('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'FooBar');
      assert.equal(errs.length, 0);
    });

    // XXX When passed as external args, convert JS types to FTL types
    // https://bugzil.la/1307116
    it.skip('works for numbers', function() {
      const msg = ctx.getMessage('bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, '3');
      assert.equal(errs.length, 0);
    });
  });
});
