"use strict";

import assert from "assert";

import { Temporal, caster } from "./utils.js";
import { FluentDateTime } from "@fluent/bundle";

suite("Temporal.ZonedDateTime", function () {
  let time, cast;

  suiteSetup(function () {
    time = Temporal.ZonedDateTime.from("1970-01-01T00:00:00Z[Etc/UTC]");
    cast = caster.castValue(time);
  });

  test("Generates a FluentDateTime", function () {
    assert(cast instanceof FluentDateTime);
  });

  test("Sets milliseconds correctly", function () {
    assert.strictEqual(cast.value, 0);
  });

  test("Set timeZone correctly", function () {
    assert.strictEqual(cast.opts.timeZone, "Etc/UTC");
  });

  test("Does not set calendar if it is iso8601", function () {
    assert.strictEqual(cast.opts.calendar, undefined);
  });

  test("Sets calendar if it is not iso8601", function () {
    const islamic = caster.castValue(time.withCalendar("islamic"));
    assert.strictEqual(islamic.opts.calendar, "islamic");
  });
});
