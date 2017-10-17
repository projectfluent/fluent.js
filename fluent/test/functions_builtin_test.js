'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from './util';

suite('Built-in functions', function() {
  let ctx;

  suite('NUMBER', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        num-decimal = { NUMBER($arg) }
        num-percent = { NUMBER($arg, style: "percent") }
        num-bad-opt = { NUMBER($arg, style: "bad") }
      `);
    });

    test('missing argument', function() {
      let msg;

      msg = ctx.getMessage('num-decimal');
      assert.equal(ctx.format(msg), 'NaN');

      msg = ctx.getMessage('num-percent');
      assert.equal(ctx.format(msg), 'NaN');

      msg = ctx.getMessage('num-bad-opt');
      assert.equal(ctx.format(msg), 'NaN');
    });

    test('number argument', function() {
      const args = {arg: 1};
      let msg;

      msg = ctx.getMessage('num-decimal');
      assert.equal(ctx.format(msg, args), '1');

      msg = ctx.getMessage('num-percent');
      assert.equal(ctx.format(msg, args), '100%');

      msg = ctx.getMessage('num-bad-opt');
      assert.equal(ctx.format(msg, args), '1');
    });

    test('string argument', function() {
      const args = {arg: "Foo"};
      let msg;

      msg = ctx.getMessage('num-decimal');
      assert.equal(ctx.format(msg, args), 'NaN');

      msg = ctx.getMessage('num-percent');
      assert.equal(ctx.format(msg, args), 'NaN');

      msg = ctx.getMessage('num-bad-opt');
      assert.equal(ctx.format(msg, args), 'NaN');
    });
  });

  suite('DATETIME', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        dt-default = { DATETIME($arg) }
        dt-month = { DATETIME($arg, month: "long") }
        dt-bad-opt = { DATETIME($arg, month: "bad") }
      `);
    });

    test('missing argument', function() {
      let msg;

      msg = ctx.getMessage('dt-default');
      assert.equal(ctx.format(msg), 'Invalid Date');

      msg = ctx.getMessage('dt-month');
      assert.equal(ctx.format(msg), 'Invalid Date');

      msg = ctx.getMessage('dt-bad-opt');
      assert.equal(ctx.format(msg), 'Invalid Date');
    });

    test.only('Date argument', function() {
      const date = new Date('2016-09-29');
      // format the date argument to account for the testrunner's timezone
      const expectedDefault =
        (new Intl.DateTimeFormat('en-US')).format(date);
      const expectedMonth =
        (new Intl.DateTimeFormat('en-US', {month: 'long'})).format(date);

      const args = {arg: date};
      let msg;

      msg = ctx.getMessage('dt-default');
      assert.equal(ctx.format(msg, args), expectedDefault);

      msg = ctx.getMessage('dt-month');
      assert.equal(ctx.format(msg, args), expectedMonth);

      msg = ctx.getMessage('dt-bad-opt');
      // The argument value will be coerced into a string by the join operation
      // in MessageContext.format.  The result looks something like this; it
      // may vary depending on the TZ:
      //     Thu Sep 29 2016 02:00:00 GMT+0200 (CEST)
      assert.equal(ctx.format(msg, args), date.toString());
    });
  });
});
