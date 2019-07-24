'use strict';

import assert from 'assert';
import ftl from "@fluent/dedent";

import FluentBundle from '../src/bundle';
import FluentResource from '../src/resource';

suite('Built-in functions', function() {
  let bundle, errors;

  setup(function () {
    errors = [];
  });

  suite('NUMBER', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addResource(new FluentResource(ftl`
        num-decimal = { NUMBER($arg) }
        num-percent = { NUMBER($arg, style: "percent") }
        num-bad-opt = { NUMBER($arg, style: "bad") }
        `));
    });

    test('missing argument', function() {
      let msg;

      errors = [];
      msg = bundle.getMessage('num-decimal');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");

      errors = [];
      msg = bundle.getMessage('num-percent');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");

      errors = [];
      msg = bundle.getMessage('num-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");
    });

    test('number argument', function() {
      const args = {arg: 1};
      let msg;

      msg = bundle.getMessage('num-decimal');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1');
      assert.strictEqual(errors.length, 0);

      msg = bundle.getMessage('num-percent');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '100%');
      assert.strictEqual(errors.length, 0);

      msg = bundle.getMessage('num-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof RangeError); // Invalid option value
    });

    test('string argument', function() {
      const args = {arg: "Foo"};
      let msg;

      errors = [];
      msg = bundle.getMessage('num-decimal');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{NUMBER()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument type to NUMBER");

      errors = [];
      msg = bundle.getMessage('num-percent');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{NUMBER()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument type to NUMBER");

      errors = [];
      msg = bundle.getMessage('num-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{NUMBER()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument type to NUMBER");
    });

    test('date argument', function() {
      const date = new Date('2016-09-29');
      const args = {arg: date};
      let msg;

      errors = [];
      msg = bundle.getMessage('num-decimal');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{NUMBER()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument type to NUMBER");

      errors = [];
      msg = bundle.getMessage('num-percent');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{NUMBER()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument type to NUMBER");

      errors = [];
      msg = bundle.getMessage('num-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{NUMBER()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument type to NUMBER");
    });

    test('invalid argument', function() {
      const args = {arg: []};
      let msg;

      errors = [];
      msg = bundle.getMessage('num-decimal');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");

      errors = [];
      msg = bundle.getMessage('num-percent');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");

      errors = [];
      msg = bundle.getMessage('num-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");
    });
  });

  suite('DATETIME', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addResource(new FluentResource(ftl`
        dt-default = { DATETIME($arg) }
        dt-month = { DATETIME($arg, month: "long") }
        dt-bad-opt = { DATETIME($arg, month: "bad") }
        `));
    });

    test('missing argument', function() {
      let msg;

      errors = [];
      msg = bundle.getMessage('dt-default');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");

      errors = [];
      msg = bundle.getMessage('dt-month');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");

      errors = [];
      msg = bundle.getMessage('dt-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");
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
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), expectedDefault);
      assert.strictEqual(errors.length, 0);

      msg = bundle.getMessage('dt-month');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), expectedMonth);
      assert.strictEqual(errors.length, 0);

      msg = bundle.getMessage('dt-bad-opt');
      // The argument value will be coerced into a string by the join operation
      // in FluentBundle.format.  The result looks something like this; it
      // may vary depending on the TZ:
      //     Thu Sep 29 2016 02:00:00 GMT+0200 (CEST)
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), date.toString());
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof RangeError); // Invalid option value
    });

    test('number argument', function() {
      let args = {arg: 1};
      let msg;

      errors = [];
      msg = bundle.getMessage('dt-default');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{DATETIME()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument type to DATETIME");

      errors = [];
      msg = bundle.getMessage('dt-month');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{DATETIME()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument type to DATETIME");

      errors = [];
      msg = bundle.getMessage('dt-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{DATETIME()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument type to DATETIME");
    });

    test('string argument', function() {
      let args = {arg: 'Foo'};
      let msg;

      errors = [];
      msg = bundle.getMessage('dt-default');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{DATETIME()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument type to DATETIME");

      errors = [];
      msg = bundle.getMessage('dt-month');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{DATETIME()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument type to DATETIME");

      errors = [];
      msg = bundle.getMessage('dt-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{DATETIME()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument type to DATETIME");
    });

    test('invalid argument', function() {
      let args = {arg: []};
      let msg;

      errors = [];
      msg = bundle.getMessage('dt-default');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");

      errors = [];
      msg = bundle.getMessage('dt-month');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");

      errors = [];
      msg = bundle.getMessage('dt-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");
    });
  });
});
