'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from './util';

suite('Built-in functions', function() {
  let ctx, args, errs;

  setup(function() {
    errs = [];
  });

  suite('NUMBER', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { NUMBER(1) }
      `);
    });

    test('formats the number', function() {
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, '1');
      assert.equal(errs.length, 0);
    });
  });

  suite('DATETIME', function(){
    let dtf;

    suiteSetup(function() {
      dtf = new Intl.DateTimeFormat('en-US');
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        foo = { DATETIME($date) }
      `);
    });

    test('formats the date', function() {
      const date = new Date('2016-09-29');
      const msg = ctx.messages.get('foo');
      const val = ctx.format(msg, { date }, errs);
      // format the date argument to account for the testrunner's timezone
      assert.equal(val, dtf.format(date));
      assert.equal(errs.length, 0);
    });
  });
});
