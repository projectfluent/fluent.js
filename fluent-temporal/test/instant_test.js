"use strict";

import assert from "assert";

import { Temporal, caster } from "./utils.js";
import { FluentDateTime } from "@fluent/bundle";

suite("Temporal.Instant", function () {
  let time, cast;

  suiteSetup(function () {
    time = new Temporal.Instant(123456789n);
    cast = caster.castValue(time);
  });

  test("Generates a FluentDateTime", function () {
    assert(cast instanceof FluentDateTime);
  });

  test("Sets milliseconds correctly", function () {
    assert.strictEqual(cast.value, 123);
  });

  test("Does not set timeZone", function () {
    assert.strictEqual(cast.opts.timeZone, undefined);
  });

  test("Does not set calendar", function () {
    assert.strictEqual(cast.opts.calendar, undefined);
  });
});
