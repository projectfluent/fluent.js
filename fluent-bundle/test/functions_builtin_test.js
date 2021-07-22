'use strict';

import assert from 'assert';
import ftl from "@fluent/dedent";

import {FluentBundle} from '../esm/bundle.js';
import {FluentResource} from '../esm/resource.js';
import {FluentNumber, FluentDateTime} from '../esm/types.js';

suite('Built-in functions', function() {
  let bundle, errors, msg;

  suite('NUMBER', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addResource(new FluentResource(ftl`
        num-bare = { NUMBER($arg) }
        num-fraction-valid = { NUMBER($arg, minimumFractionDigits: 1) }
        num-fraction-bad = { NUMBER($arg, minimumFractionDigits: "oops") }
        num-style = { NUMBER($arg, style: "percent") }
        num-currency = { NUMBER($arg, currency: "EUR") }
        num-unknown = { NUMBER($arg, unknown: "unknown") }
        `));
    });

    test('missing argument', function() {
      errors = [];
      msg = bundle.getMessage('num-bare');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");

      errors = [];
      msg = bundle.getMessage('num-fraction-valid');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");

      errors = [];
      msg = bundle.getMessage('num-fraction-bad');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");

      errors = [];
      msg = bundle.getMessage('num-style');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");

      errors = [];
      msg = bundle.getMessage('num-currency');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");

      errors = [];
      msg = bundle.getMessage('num-unknown');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");
    });

    test('number argument', function() {
      let arg = 1234;

      errors = [];
      msg = bundle.getMessage('num-bare');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,234');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-fraction-valid');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,234.0');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-fraction-bad');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1234');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof RangeError); // Invalid option value

      errors = [];
      msg = bundle.getMessage('num-style');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,234');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-currency');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,234');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-unknown');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,234');
      assert.strictEqual(errors.length, 0);
    });

    test('FluentNumber argument, minimumFractionDigits=3', function() {
      let arg =  new FluentNumber(1234, {
        minimumFractionDigits: 3
      });

      errors = [];
      msg = bundle.getMessage('num-bare');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,234.000');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-fraction-valid');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,234.0');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-fraction-bad');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1234');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof RangeError); // Invalid option value

      errors = [];
      msg = bundle.getMessage('num-style');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,234.000');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-currency');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,234.000');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-unknown');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,234.000');
      assert.strictEqual(errors.length, 0);
    });

    test('FluentNumber argument, style="currency", currency="USD"', function() {
      let arg = new FluentNumber(1234, {
        style: "currency",
        currency: "USD"
      });

      errors = [];
      msg = bundle.getMessage('num-bare');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '$1,234.00');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-fraction-valid');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '$1,234.0');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-fraction-bad');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1234');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof RangeError); // Invalid option value

      errors = [];
      msg = bundle.getMessage('num-style');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '$1,234.00');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-currency');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '$1,234.00');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-unknown');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '$1,234.00');
      assert.strictEqual(errors.length, 0);
    });

    test('FluentDateTime argument', function () {
      // NUMBER must ignore datetime options
      let date = new Date('2016-09-29');
      let arg = new FluentDateTime(date, {
        month: "short",
        day: "numeric",
      });

      errors = [];
      msg = bundle.getMessage('num-bare');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,475,107,200,000');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-fraction-valid');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,475,107,200,000.0');
      assert.strictEqual(errors.length, 0);
    });

    test('string argument', function() {
      let arg = "Foo";

      errors = [];
      msg = bundle.getMessage('num-bare');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{NUMBER()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to NUMBER");

      errors = [];
      msg = bundle.getMessage('num-fraction-valid');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{NUMBER()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to NUMBER");

      errors = [];
      msg = bundle.getMessage('num-fraction-bad');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{NUMBER()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to NUMBER");

      errors = [];
      msg = bundle.getMessage('num-style');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{NUMBER()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to NUMBER");

      errors = [];
      msg = bundle.getMessage('num-currency');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{NUMBER()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to NUMBER");

      errors = [];
      msg = bundle.getMessage('num-unknown');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{NUMBER()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to NUMBER");
    });

    test('date argument', function() {
      let arg = new Date('2016-09-29');

      errors = [];
      msg = bundle.getMessage('num-bare');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,475,107,200,000');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-fraction-valid');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,475,107,200,000.0');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-fraction-bad');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1475107200000');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof RangeError); // Invalid option value

      errors = [];
      msg = bundle.getMessage('num-style');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,475,107,200,000');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-currency');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,475,107,200,000');
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('num-unknown');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1,475,107,200,000');
      assert.strictEqual(errors.length, 0);
    });

    test('invalid argument', function() {
      let arg = [];

      errors = [];
      msg = bundle.getMessage('num-bare');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");

      errors = [];
      msg = bundle.getMessage('num-fraction-valid');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");

      errors = [];
      msg = bundle.getMessage('num-fraction-bad');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");

      errors = [];
      msg = bundle.getMessage('num-style');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");

      errors = [];
      msg = bundle.getMessage('num-currency');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");

      errors = [];
      msg = bundle.getMessage('num-unknown');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{NUMBER($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");
    });
  });

  suite('DATETIME', function(){
    suiteSetup(function() {
      bundle = new FluentBundle('en-US', { useIsolating: false });
      bundle.addResource(new FluentResource(ftl`
        dt-bare = { DATETIME($arg) }
        dt-month-valid = { DATETIME($arg, month: "long") }
        dt-month-bad = { DATETIME($arg, month: "oops") }
        dt-timezone = { DATETIME($arg, timezone: "America/New_York") }
        dt-unknown = { DATETIME($arg, unknown: "unknown") }
        `));
    });

    test('missing argument', function() {
      errors = [];
      msg = bundle.getMessage('dt-bare');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");

      errors = [];
      msg = bundle.getMessage('dt-month-valid');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");

      errors = [];
      msg = bundle.getMessage('dt-month-bad');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");

      errors = [];
      msg = bundle.getMessage('dt-timezone');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");

      errors = [];
      msg = bundle.getMessage('dt-unknown');
      assert.strictEqual(bundle.formatPattern(msg.value, {}, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof ReferenceError);
      assert.strictEqual(errors[0].message, "Unknown variable: $arg");
    });

    test('Date argument', function () {
      let arg = new Date('2016-09-29');

      // Format the date argument to account for the testrunner's timezone.
      let expectedDate =
        (new Intl.DateTimeFormat('en-US')).format({arg}.arg);
      let expectedMonthLong =
        (new Intl.DateTimeFormat('en-US', {month: 'long'})).format({arg}.arg);

      errors = [];
      msg = bundle.getMessage('dt-bare');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), expectedDate);
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('dt-month-valid');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), expectedMonthLong);
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('dt-month-bad');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '2016-09-29T00:00:00.000Z');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof RangeError); // Invalid option value

      errors = [];
      msg = bundle.getMessage('dt-timezone');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), expectedDate);
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('dt-unknown');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), expectedDate);
      assert.strictEqual(errors.length, 0);
    });

    test('FluentDateTime argument', function () {
      let date = new Date('2016-09-29');
      let arg = new FluentDateTime(date, {
        month: "short",
        day: "numeric",
      });

      // Format the date argument to account for the testrunner's timezone.
      let expectedMonthShort =
        (new Intl.DateTimeFormat('en-US', {month: 'short', day: "numeric"})).format(date);
      let expectedMonthLong =
        (new Intl.DateTimeFormat('en-US', {month: 'long', day: "numeric"})).format(date);

      errors = [];
      msg = bundle.getMessage('dt-bare');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), expectedMonthShort);
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('dt-month-valid');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), expectedMonthLong);
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('dt-month-bad');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '2016-09-29T00:00:00.000Z');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof RangeError); // Invalid option value

      errors = [];
      msg = bundle.getMessage('dt-timezone');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), expectedMonthShort);
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('dt-unknown');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), expectedMonthShort);
      assert.strictEqual(errors.length, 0);
    });

    test('FluentNumber argument, minimumFractionDigits=3', function() {
      // DATETIME must ignore number options
      let date = new Date('2016-09-29');
      let arg =  new FluentNumber(Number(date), {
        minimumFractionDigits: 3
      });

      // Format the date argument to account for the testrunner's timezone.
      let expectedDate =
        (new Intl.DateTimeFormat('en-US')).format(date);
      let expectedMonthLong =
        (new Intl.DateTimeFormat('en-US', {month: 'long'})).format(date);

      errors = [];
      msg = bundle.getMessage('dt-bare');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), expectedDate);
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('dt-month-valid');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), expectedMonthLong);
      assert.strictEqual(errors.length, 0);
    });

    test('number argument', function() {
      let arg = -1;

      // Format the date argument to account for the testrunner's timezone.
      let expectedDate =
        (new Intl.DateTimeFormat('en-US')).format({arg}.arg);
      let expectedMonthLong =
        (new Intl.DateTimeFormat('en-US', {month: 'long'})).format({arg}.arg);

      errors = [];
      msg = bundle.getMessage('dt-bare');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), expectedDate);
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('dt-month-valid');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), expectedMonthLong);
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('dt-month-bad');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '1969-12-31T23:59:59.999Z');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof RangeError); // Invalid option value

      errors = [];
      msg = bundle.getMessage('dt-timezone');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), expectedDate);
      assert.strictEqual(errors.length, 0);

      errors = [];
      msg = bundle.getMessage('dt-unknown');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), expectedDate);
      assert.strictEqual(errors.length, 0);
    });

    test('string argument', function() {
      let arg = 'Foo';

      errors = [];
      msg = bundle.getMessage('dt-bare');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{DATETIME()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to DATETIME");

      errors = [];
      msg = bundle.getMessage('dt-month-valid');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{DATETIME()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to DATETIME");

      errors = [];
      msg = bundle.getMessage('dt-month-bad');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{DATETIME()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to DATETIME");

      errors = [];
      msg = bundle.getMessage('dt-timezone');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{DATETIME()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to DATETIME");

      errors = [];
      msg = bundle.getMessage('dt-unknown');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{DATETIME()}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Invalid argument to DATETIME");
    });

    test('invalid argument', function() {
      let arg = [];

      errors = [];
      msg = bundle.getMessage('dt-bare');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");

      errors = [];
      msg = bundle.getMessage('dt-month-valid');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");

      errors = [];
      msg = bundle.getMessage('dt-month-bad');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");

      errors = [];
      msg = bundle.getMessage('dt-timezone');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");

      errors = [];
      msg = bundle.getMessage('dt-unknown');
      assert.strictEqual(bundle.formatPattern(msg.value, {arg}, errors), '{DATETIME($arg)}');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0] instanceof TypeError);
      assert.strictEqual(errors[0].message, "Variable type not supported: $arg, object");
    });
  });
});
