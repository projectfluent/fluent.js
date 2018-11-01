'use strict';

import assert from 'assert';

import FluentBundle from '../src/bundle';
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
      assert.equal(bundle.format('num-decimal'), 'NaN');
      assert.equal(bundle.format('num-percent'), 'NaN');
      assert.equal(bundle.format('num-bad-opt'), 'NaN');
    });

    test('number argument', function() {
      const args = {arg: 1};
      assert.equal(bundle.format('num-decimal', args), '1');
      assert.equal(bundle.format('num-percent', args), '100%');
      assert.equal(bundle.format('num-bad-opt', args), '1');
    });

    test('string argument', function() {
      const args = {arg: "Foo"};
      assert.equal(bundle.format('num-decimal', args), 'NaN');
      assert.equal(bundle.format('num-percent', args), 'NaN');
      assert.equal(bundle.format('num-bad-opt', args), 'NaN');
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
      assert.equal(bundle.format('dt-default'), 'Invalid Date');
      assert.equal(bundle.format('dt-month'), 'Invalid Date');
      assert.equal(bundle.format('dt-bad-opt'), 'Invalid Date');
    });

    test('Date argument', function () {
      const date = new Date('2016-09-29');
      // format the date argument to account for the testrunner's timezone
      const expectedDefault =
        (new Intl.DateTimeFormat('en-US')).format(date);
      const expectedMonth =
        (new Intl.DateTimeFormat('en-US', {month: 'long'})).format(date);

      const args = {arg: date};
      assert.equal(bundle.format('dt-default', args), expectedDefault);
      assert.equal(bundle.format('dt-month', args), expectedMonth);

      // The argument value will be coerced into a string by the join operation
      // in FluentBundle.format.  The result looks something like this; it
      // may vary depending on the TZ:
      //     Thu Sep 29 2016 02:00:00 GMT+0200 (CEST)
      assert.equal(bundle.format('dt-bad-opt', args), date.toString());
    });
  });
});
