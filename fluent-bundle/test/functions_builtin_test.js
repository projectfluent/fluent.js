'use strict';

import assert from 'assert';
import ftl from "@fluent/dedent";

import {FluentBundle} from '../esm/bundle';
import {FluentResource} from '../esm/resource';
import {FluentNumber} from '../esm/types';

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
        num-currency-style = { NUMBER($arg, style: "currency") }
        num-currency-currency = { NUMBER($arg, currency: "EUR") }
        num-currency-override = { NUMBER($arg, style: "currency", currency: "JPY") }
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

      errors = [];
      msg = bundle.getMessage('num-currency-style');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");

      errors = [];
      msg = bundle.getMessage('num-currency-currency');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");

      errors = [];
      msg = bundle.getMessage('num-currency-override');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");
    });

    test('number argument', function() {
      const args = {arg: 1234};
      let msg;

      msg = bundle.getMessage('num-decimal');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1,234');
      assert.strictEqual(errors.length, 0);

      msg = bundle.getMessage('num-percent');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '123,400%');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1234');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof RangeError); // Invalid option value

      errors = [];
      msg = bundle.getMessage('num-currency-style');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1234');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError); // Currency code is required

      errors = [];
      msg = bundle.getMessage('num-currency-currency');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1,234');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-currency-override');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1234');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError); // Currency code is required
    });

    test('FluentNumber argument, minimumFractionDigits=3', function() {
      const args = {arg: new FluentNumber(1234, {minimumFractionDigits: 3})};
      let msg;

      msg = bundle.getMessage('num-decimal');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1,234.000');
      assert.strictEqual(errors.length, 0);

      msg = bundle.getMessage('num-percent');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '123,400.000%');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1234');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof RangeError); // Invalid option value

      errors = [];
      msg = bundle.getMessage('num-currency-style');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1234');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError); // Currency code is required

      errors = [];
      msg = bundle.getMessage('num-currency-currency');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1,234.000');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-currency-override');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1234');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError); // Currency code is required
    });

    test('FluentNumber argument, style="currency", currency="USD"', function() {
      const args = {arg: new FluentNumber(1234, {style: "currency", currency: "USD"})};
      let msg;

      msg = bundle.getMessage('num-decimal');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '$1,234.00');
      assert.strictEqual(errors.length, 0);

      msg = bundle.getMessage('num-percent');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '123,400%');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1234');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof RangeError); // Invalid option value

      errors = [];
      msg = bundle.getMessage('num-currency-style');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '$1,234.00');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-currency-currency');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '$1,234.00');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-currency-override');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '$1,234.00');
      assert.strictEqual(errors.length, 0);
    });

    test('string argument', function() {
      const args = {arg: "Foo"};
      let msg;

      errors = [];
      msg = bundle.getMessage('num-decimal');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{NUMBER()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to NUMBER");

      errors = [];
      msg = bundle.getMessage('num-percent');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{NUMBER()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to NUMBER");

      errors = [];
      msg = bundle.getMessage('num-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{NUMBER()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to NUMBER");
    });

    test('date argument', function() {
      const date = new Date('2016-09-29');
      const args = {arg: date};
      let msg;

      errors = [];
      msg = bundle.getMessage('num-decimal');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1,475,107,200,000');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-percent');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '147,510,720,000,000%');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1475107200000');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof RangeError); // Invalid option value
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
      let args = {arg: new Date('2016-09-29')};
      let msg;

      // Format the date argument to account for the testrunner's timezone.
      let expectedDate =
        (new Intl.DateTimeFormat('en-US')).format(args.arg);
      let expectedMonth =
        (new Intl.DateTimeFormat('en-US', {month: 'long'})).format(args.arg);

      msg = bundle.getMessage('dt-default');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), expectedDate);
      assert.strictEqual(errors.length, 0);

      msg = bundle.getMessage('dt-month');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), expectedMonth);
      assert.strictEqual(errors.length, 0);

      msg = bundle.getMessage('dt-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '2016-09-29T00:00:00.000Z');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof RangeError); // Invalid option value
    });

    test('number argument', function() {
      let args = {arg: -1};
      let msg;

      // Format the date argument to account for the testrunner's timezone.
      let expectedDate =
        (new Intl.DateTimeFormat('en-US')).format(args.arg);
      let expectedMonth =
        (new Intl.DateTimeFormat('en-US', {month: 'long'})).format(args.arg);

      errors = [];
      msg = bundle.getMessage('dt-default');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), expectedDate);
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('dt-month');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), expectedMonth);
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('dt-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '1969-12-31T23:59:59.999Z');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof RangeError); // Invalid option value
    });

    test('string argument', function() {
      let args = {arg: 'Foo'};
      let msg;

      errors = [];
      msg = bundle.getMessage('dt-default');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{DATETIME()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to DATETIME");

      errors = [];
      msg = bundle.getMessage('dt-month');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{DATETIME()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to DATETIME");

      errors = [];
      msg = bundle.getMessage('dt-bad-opt');
      assert.strictEqual(bundle.formatPattern(msg.value, args, errors), '{DATETIME()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to DATETIME");
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
