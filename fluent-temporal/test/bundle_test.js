"use strict";

import assert from "assert";
import ftl from "@fluent/dedent";
import { FluentBundle, FluentResource } from "@fluent/bundle";

import { Temporal, caster } from "./utils.js";

suite('With FluentBundle', function () {
  let bundle, errs, args;

  suiteSetup(function () {
    bundle = new FluentBundle("en-US", { cast: caster });
    bundle.addResource(
      new FluentResource(ftl`
      no-formatting = { $arg }
      with-formatting = { DATETIME($arg, month: "long", year: "numeric", day: "numeric") }
      `)
    );
  });

  setup(function () {
    errs = [];
  });

  suite("Temporal.ZonedDateTime", function () {
    suiteSetup(function () {
      // date chosen so that it would be a different day in UTC
      const dateTime = "2025-01-01T18:00:00-06:00[America/Chicago]";
      args = { arg: Temporal.ZonedDateTime.from(dateTime) };
    });

    test("without extra formatting", function () {
      const msg = bundle.getMessage("no-formatting");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "1/1/2025");
      assert.strictEqual(errs.length, 0);
    });

    test("with extra formatting", function () {
      const msg = bundle.getMessage("with-formatting");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "January 1, 2025");
      assert.strictEqual(errs.length, 0);
    });
  });
});
