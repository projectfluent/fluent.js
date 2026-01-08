/* global Temporal */

import assert from "assert";
import ftl from "@fluent/dedent";

import { FluentBundle } from "../src/bundle.ts";
import { FluentResource } from "../src/resource.ts";
import { FluentDateTime } from "../src/types.ts";

suite("Temporal support", function () {
  let bundle, arg;

  // Node.js prior to v20 does not support the iso8601 calendar
  const supportIso8601 =
    new Intl.DateTimeFormat("en-US", { calendar: "iso8601" }).format(0) ===
    "1970-01-01";

  function msg(id, errors = undefined) {
    const errs = [];
    const msg_ = bundle.getMessage(id);
    const res = bundle.formatPattern(msg_.value, { arg }, errors || errs);
    if (errs.length > 0) {
      assert.fail(errs[0].message);
    }
    return res;
  }

  beforeAll(async function () {
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
    beforeEach(function () {
      arg = Temporal.Instant.from("1970-01-01T00:00:00Z");
    });

    test("direct interpolation", function () {
      assert.strictEqual(msg("direct"), arg.toLocaleString("en-US"));
    });

    test("run through DATETIME()", function () {
      assert.strictEqual(msg("dt"), arg.toLocaleString("en-US"));
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
      assert.strictEqual(+arg, 0);
    });
  });

  suite("Temporal.PlainDate (gregory)", function () {
    beforeEach(function () {
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
      arg = new FluentDateTime(arg, { month: "long" });
      assert.strictEqual(msg("dt"), "January");
    });

    test("can be converted to a number", function () {
      arg = new FluentDateTime(arg);
      assert.strictEqual(+arg, 0);
    });
  });

  if (supportIso8601) {
    suite("Temporal.PlainDate (iso8601)", function () {
      beforeEach(function () {
        arg = Temporal.PlainDate.from("1970-01-01[u-ca=iso8601]");
      });

      test("direct interpolation", function () {
        assert.strictEqual(msg("direct"), "1970-01-01");
      });

      test("run through DATETIME()", function () {
        assert.strictEqual(msg("dt"), "1970-01-01");
      });

      test("can be converted to a number", function () {
        arg = new FluentDateTime(arg);
        assert.strictEqual(+arg, 0);
      });
    });
  }

  suite("Temporal.PlainDateTime", function () {
    beforeEach(function () {
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
    beforeEach(function () {
      arg = Temporal.PlainTime.from("00:00:00");
    });

    test("direct interpolation", function () {
      assert.strictEqual(msg("direct"), "12:00:00 AM");
    });

    test("run through DATETIME()", function () {
      assert.strictEqual(msg("dt"), "12:00:00 AM");
    });

    test("wrapped in FluentDateTime", function () {
      arg = new FluentDateTime(arg, { timeZone: "America/New_York" });
      assert.strictEqual(msg("dt"), "12:00:00 AM");
    });

    test("cannot be converted to a number", function () {
      arg = new FluentDateTime(arg);
      assert.throws(() => +arg, TypeError);
    });
  });

  suite("PlainYearMonth (gregory)", function () {
    beforeEach(function () {
      arg = Temporal.PlainYearMonth.from({
        year: 1970,
        month: 1,
        calendar: "gregory",
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
      assert.throws(() => +arg, TypeError);
    });
  });
});
