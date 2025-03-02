"use strict";

import assert from "assert";
import ftl from "@fluent/dedent";

import { FluentBundle } from "../esm/bundle.js";
import { FluentResource } from "../esm/resource.js";
import { FluentDateTime } from "../esm/types.js";

suite("Temporal support", function () {
  let bundle, arg;

  function msg(id, errors = undefined) {
    const errs = [];
    const msg = bundle.getMessage(id);
    const res = bundle.formatPattern(msg.value, { arg }, errors || errs);
    if (errs.length > 0) { assert.fail(errs[0].message); }
    return res;
  }

  suiteSetup(async function () {
    if (typeof Temporal === "undefined") {
      await import("temporal-polyfill/global");
    }

    bundle = new FluentBundle("en-US", { useIsolating: false });
    bundle.addResource(
      new FluentResource(ftl`
      direct = { $arg }
      dt = { DATETIME($arg) }
      month = { DATETIME($arg, month: "long", year: "numeric") }
      timezone = { DATETIME($arg, timeZoneName: "shortGeneric") }
      `)
    );
  });

  suite("Temporal.Instant", function () {
    setup(function () {
      arg = Temporal.Instant.from("1970-01-01T00:00:00Z");
    });

    test("direct interpolation", function () {
      assert.strictEqual(msg("direct"), "1/1/1970, 1:00:00 AM");
    });

    test("run through DATETIME()", function () {
      assert.strictEqual(msg("dt"), "1/1/1970, 1:00:00 AM");
    });

    test("run through DATETIME() with month option", function () {
      assert.strictEqual(msg("month"), "January 1970");
    });

    test("wrapped in FluentDateTime", function () {
      arg = new FluentDateTime(arg, { timeZone: "America/New_York" });
      assert.strictEqual(msg("dt"), "12/31/1969, 7:00:00 PM");
      assert.strictEqual(msg("timezone"), "12/31/1969, 7:00:00 PM ET");
    });

    test("can be converted to a number", function () {
      arg = new FluentDateTime(arg);
      assert.strictEqual(arg.toNumber(), 0);
    });
  });

  suite("Temporal.PlainDate (gregory)", function () {
    setup(function () {
      arg = Temporal.PlainDate.from("1970-01-01[u-ca=gregory]");
    });

    test("direct interpolation", function () {
      assert.strictEqual(msg("direct"), "1/1/1970");
    });

    test("run through DATETIME()", function () {
      assert.strictEqual(msg("dt"), "1/1/1970");
    });

    test("run through DATETIME() with month option", function () {
      assert.strictEqual(msg("month"), "January 1970");
    });

    test("wrapped in FluentDateTime", function () {
      arg = new FluentDateTime(arg, { calendar: "iso8601" });
      assert.strictEqual(msg("dt"), "1970-01-01");
    });

    test("can be converted to a number", function () {
      arg = new FluentDateTime(arg);
      assert.strictEqual(arg.toNumber(), 0);
    });
  });

  suite("Temporal.PlainDate (iso8601)", function () {
    setup(function () {
      arg = Temporal.PlainDate.from("1970-01-01[u-ca=iso8601]");
    });

    test("direct interpolation", function () {
      assert.strictEqual(msg("direct"), "1970-01-01");
    });

    test("run through DATETIME()", function () {
      assert.strictEqual(msg("dt"), "1970-01-01");
    });

    test("run through DATETIME() with month option", function () {
      assert.strictEqual(msg("month"), "1970 January");
    });

    test("wrapped in FluentDateTime", function () {
      arg = new FluentDateTime(arg, { calendar: "gregory" });
      assert.strictEqual(msg("dt"), "1/1/1970");
    });

    test("can be converted to a number", function () {
      arg = new FluentDateTime(arg);
      assert.strictEqual(arg.toNumber(), 0);
    });
  });

  suite("Temporal.PlainDateTime", function () {
    setup(function () {
      arg = Temporal.PlainDateTime.from("1970-01-01T00:00:00[u-ca=gregory]");
    });

    test("direct interpolation", function () {
      assert.strictEqual(msg("direct"), "1/1/1970, 12:00:00 AM");
    });

    test("run through DATETIME()", function () {
      assert.strictEqual(msg("dt"), "1/1/1970, 12:00:00 AM");
    });

    test("run through DATETIME() with month option", function () {
      assert.strictEqual(msg("month"), "January 1970");
    });

    test("wrapped in FluentDateTime", function () {
      arg = new FluentDateTime(arg, { timeZone: "America/New_York" });
      assert.strictEqual(msg("dt"), "1/1/1970, 12:00:00 AM");
    });
  });

  suite("Temporal.PlainTime", function () {
    setup(function () {
      arg = Temporal.PlainTime.from("00:00:00");
    });

    test("direct interpolation", function () {
      assert.strictEqual(msg("direct"), "12:00:00 AM");
    });

    test("run through DATETIME()", function () {
      assert.strictEqual(msg("dt"), "12:00:00 AM");
    });

    test("run through DATETIME() with month option", function () {
      assert.strictEqual(msg("month"), "12:00:00 AM");
    });

    test("wrapped in FluentDateTime", function () {
      arg = new FluentDateTime(arg, { timeZone: "America/New_York" });
      assert.strictEqual(msg("dt"), "12:00:00 AM");
    });

    test("cannot be converted to a number", function () {
      arg = new FluentDateTime(arg);
      assert.throws(() => arg.toNumber(), TypeError);
    });
  });

  suite("PlainYearMonth (gregory)", function () {
    setup(function () {
      arg = Temporal.PlainYearMonth.from({
        year: 1970,
        month: 1,
        calendar: "gregory"
      });
    });

    test("direct interpolation", function () {
      assert.strictEqual(msg("direct"), "1/1970");
    });

    test("run through DATETIME()", function () {
      assert.strictEqual(msg("dt"), "1/1970");
    });

    test("run through DATETIME() with month option", function () {
      assert.strictEqual(msg("month"), "January 1970");
    });

    test("wrapped in FluentDateTime", function () {
      arg = new FluentDateTime(arg, { timeZone: "America/New_York" });
      assert.strictEqual(msg("dt"), "1/1970");
    });

    test("cannot be converted to a number", function () {
      arg = new FluentDateTime(arg);
      assert.throws(() => arg.toNumber(), TypeError);
    });
  });

  suite("Temporal.ZonedDateTime (gregory)", function () {
    setup(function () {
      arg = Temporal.ZonedDateTime.from("1970-01-01T00:00:00Z[UTC][u-ca=gregory]");
    });

    test("direct interpolation", function () {
      assert.strictEqual(msg("direct"), "1/1/1970, 12:00:00 AM");
    });

    test("run through DATETIME()", function () {
      assert.strictEqual(msg("dt"), "1/1/1970, 12:00:00 AM");
    });

    test("run through DATETIME() with month option", function () {
      assert.strictEqual(msg("month"), "January 1970");
    });

    test("wrapped in FluentDateTime", function () {
      arg = new FluentDateTime(arg, { timeZone: "America/New_York" });
      assert.strictEqual(msg("dt"), "12/31/1969, 7:00:00 PM");
      assert.strictEqual(msg("timezone"), "12/31/1969, 7:00:00 PM ET");
    });

    test("respects timeZoneId", function () {
      assert.strictEqual(msg("timezone"), "1/1/1970, 12:00:00 AM GMT");
      arg = arg.withTimeZone("America/New_York");
      assert.strictEqual(msg("timezone"), "12/31/1969, 7:00:00 PM ET");
    });

    test("can be converted to a number", function () {
      arg = new FluentDateTime(arg);
      assert.strictEqual(arg.toNumber(), 0);
    });
  });

  suite("Temporal.ZonedDateTime (iso8601)", function () {
    setup(function () {
      arg = Temporal.ZonedDateTime.from("1970-01-01T00:00:00Z[UTC][u-ca=iso8601]");
    });

    test("direct interpolation", function () {
      assert.strictEqual(msg("direct"), "1970-01-01, 12:00:00 AM");
    });

    test("run through DATETIME()", function () {
      assert.strictEqual(msg("dt"), "1970-01-01, 12:00:00 AM");
    });

    test("run through DATETIME() with month option", function () {
      assert.strictEqual(msg("month"), "1970 January");
    });

    test("wrapped in FluentDateTime", function () {
      arg = new FluentDateTime(arg, { timeZone: "America/New_York" });
      assert.strictEqual(msg("dt"), "1969-12-31, 7:00:00 PM");
      assert.strictEqual(msg("timezone"), "1969-12-31, 7:00:00 PM ET");
    });

    test("respects timeZoneId", function () {
      assert.strictEqual(msg("timezone"), "1970-01-01, 12:00:00 AM GMT");
      arg = arg.withTimeZone("America/New_York");
      assert.strictEqual(msg("timezone"), "1969-12-31, 7:00:00 PM ET");
    });
  });
});
