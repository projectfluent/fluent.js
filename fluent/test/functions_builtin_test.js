'use strict';

import assert from 'assert';

import FluentBundle from '../src/context';
import { ftl } from '../src/util';

suite('Built-in functions', function() {
  let bundle;

  suite('NUMBER', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        num-decimal = { NUMBER($arg) }
        num-percent = { NUMBER($arg, style: "percent") }
        num-bad-opt = { NUMBER($arg, style: "bad") }
      `);
    });

    test('missing argument', function() {
      let msg;

      msg = bundle.getMessage('num-decimal');
      assert.equal(bundle.format(msg), 'NaN');

      msg = bundle.getMessage('num-percent');
      assert.equal(bundle.format(msg), 'NaN');

      msg = bundle.getMessage('num-bad-opt');
      assert.equal(bundle.format(msg), 'NaN');
    });

    test('number argument', function() {
      const args = {arg: 1};
      let msg;

      msg = bundle.getMessage('num-decimal');
      assert.equal(bundle.format(msg, args), '1');

      msg = bundle.getMessage('num-percent');
      assert.equal(bundle.format(msg, args), '100%');

      msg = bundle.getMessage('num-bad-opt');
      assert.equal(bundle.format(msg, args), '1');
    });

    test('string argument', function() {
      const args = {arg: "Foo"};
      let msg;

      msg = bundle.getMessage('num-decimal');
      assert.equal(bundle.format(msg, args), 'NaN');

      msg = bundle.getMessage('num-percent');
      assert.equal(bundle.format(msg, args), 'NaN');

      msg = bundle.getMessage('num-bad-opt');
      assert.equal(bundle.format(msg, args), 'NaN');
    });
  });

  suite('DATETIME', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addMessages(ftl`
        dt-default = { DATETIME($arg) }
        dt-month = { DATETIME($arg, month: "long") }
        dt-bad-opt = { DATETIME($arg, month: "bad") }
      `);
    });

    test('missing argument', function() {
      let msg;

      msg = bundle.getMessage('dt-default');
      assert.equal(bundle.format(msg), 'Invalid Date');

      msg = bundle.getMessage('dt-month');
      assert.equal(bundle.format(msg), 'Invalid Date');

      msg = bundle.getMessage('dt-bad-opt');
      assert.equal(bundle.format(msg), 'Invalid Date');
    });

    test('Date argument', function () {
      const date = new Date('2016-09-29');
      // format the date argument to account for the testrunner's timezone
      const expectedDefault =
        (new Intl.DateTimeFormat('en-US')).format(date);
      const expectedMonth =
        (new Intl.DateTimeFormat('en-US', {month: 'long'})).format(date);

      const args = {arg: date};
      let msg;

      msg = bundle.getMessage('dt-default');
      assert.equal(bundle.format(msg, args), expectedDefault);

      msg = bundle.getMessage('dt-month');
      assert.equal(bundle.format(msg, args), expectedMonth);

      msg = bundle.getMessage('dt-bad-opt');
      // The argument value will be coerced into a string by the join operation
      // in FluentBundle.format.  The result looks something like this; it
      // may vary depending on the TZ:
      //     Thu Sep 29 2016 02:00:00 GMT+0200 (CEST)
      assert.equal(bundle.format(msg, args), date.toString());
    });
  });
});
