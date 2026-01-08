import ftl from "@fluent/dedent";
import assert from "assert";

import {
  FluentBundle,
  FluentDateTime,
  FluentNumber,
  FluentResource,
} from "../src/index.ts";

suite("Runtime-specific functions", function () {
  suite("passing into the constructor", function () {
    let bundle, errs;

    beforeAll(function () {
      bundle = new FluentBundle("en-US", {
        useIsolating: false,
        functions: {
          CONCAT: args => args.reduce((a, b) => `${a}${b}`, ""),
          SUM: args => new FluentNumber(args.reduce((a, b) => a + b, 0)),
          PLATFORM: () => "windows",
        },
      });
      bundle.addResource(
        new FluentResource(ftl`
        foo = { CONCAT("Foo", "Bar") }
        bar = { SUM(1, 2) }
        pref =
          { PLATFORM() ->
              [windows] Options
             *[other] Preferences
          }
        `)
      );
      errs = [];
    });

    test("works for strings", function () {
      const msg = bundle.getMessage("foo");
      const val = bundle.formatPattern(msg.value, undefined, errs);
      assert.strictEqual(val, "FooBar");
      assert.strictEqual(errs.length, 0);
    });

    test("works for selectors", function () {
      const msg = bundle.getMessage("pref");
      const val = bundle.formatPattern(msg.value, undefined, errs);
      assert.strictEqual(val, "Options");
      assert.strictEqual(errs.length, 0);
    });

    test("works for numbers", function () {
      const msg = bundle.getMessage("bar");
      const val = bundle.formatPattern(msg.value, undefined, errs);
      assert.strictEqual(val, "3");
      assert.strictEqual(errs.length, 0);
    });
  });

  suite("firefox-devtools/profiler@9c8fb55", () => {
    /** @type {FluentBundle} */
    let bundle;

    beforeAll(() => {
      const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
      const ONE_YEAR_IN_MS = 365 * ONE_DAY_IN_MS;

      const DATE_FORMATS = {
        thisDay: { hour: "numeric", minute: "numeric" },
        thisYear: {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        },
        ancient: {
          year: "numeric",
          month: "short",
          day: "numeric",
        },
      };

      const SHORTDATE = args => {
        const date = args[0];
        const nowTimestamp = Number(new Date("2025-02-15T12:00"));

        const timeDifference = nowTimestamp - +date;
        if (timeDifference < 0 || timeDifference > ONE_YEAR_IN_MS) {
          return new FluentDateTime(date, DATE_FORMATS.ancient);
        }
        if (timeDifference > ONE_DAY_IN_MS) {
          return new FluentDateTime(date, DATE_FORMATS.thisYear);
        }
        return new FluentDateTime(date, DATE_FORMATS.thisDay);
      };

      const messages = ftl`\nkey = { SHORTDATE($date) }\n`;
      const resource = new FluentResource(messages);
      bundle = new FluentBundle("en-US", { functions: { SHORTDATE } });
      bundle.addResource(resource);
    });

    test("works with difference in hours", function () {
      const msg = bundle.getMessage("key");
      const date = new Date("2025-02-15T10:30");
      const errs = [];
      const val = bundle.formatPattern(msg.value, { date }, errs);
      assert.strictEqual(val, "10:30 AM");
      assert.strictEqual(errs.length, 0);
    });

    test("works with difference in days", function () {
      const msg = bundle.getMessage("key");
      const date = new Date("2025-02-03T10:30");
      const errs = [];
      const val = bundle.formatPattern(msg.value, { date }, errs);
      assert.strictEqual(val, "Feb 3, 10:30 AM");
      assert.strictEqual(errs.length, 0);
    });

    test("works with difference in years", function () {
      const msg = bundle.getMessage("key");
      const date = new Date("2023-02-03T10:30");
      const errs = [];
      const val = bundle.formatPattern(msg.value, { date }, errs);
      assert.strictEqual(val, "Feb 3, 2023");
      assert.strictEqual(errs.length, 0);
    });
  });
});
