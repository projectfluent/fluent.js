'use strict';

import assert from 'assert';

import '../../src/intl/polyfill';
import { MessageContext } from '../../src/intl/context';
import { ftl } from '../util';

describe('Runtime-specific functions', function() {
  let ctx, args, errs;

  beforeEach(function() {
    errs = [];
  });

  describe('constructor', function(){
    before(function() {
      ctx = new MessageContext('en-US', {
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

    it('works for strings', function() {
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, 'FooBar');
      assert.equal(errs.length, 0);
    });

    it.skip('works for numbers', function() {
      const msg = ctx.messages.get('bar');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, '3');
      assert.equal(errs.length, 0);
    });
  });
});
