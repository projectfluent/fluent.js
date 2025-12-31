import assert from "assert";
import ftl from "@fluent/dedent";

import { FluentBundle } from "../src/bundle.ts";
import { FluentResource } from "../src/resource.ts";
import { expect, vi } from "vitest";

suite("FluentBundle constructor", function () {
  beforeAll(() => {
    vi.spyOn(Intl, "NumberFormat").mockImplementation(
      class Mock {
        format = vi.fn(() => "1");
      }
    );
  });

  test("accepts a single locale string", function () {
    const errs = [];
    const bundle = new FluentBundle("en-US", { useIsolating: false });
    bundle.addResource(
      new FluentResource(ftl`
      foo = Foo { 1 }
      `)
    );

    const msg = bundle.getMessage("foo");
    const val = bundle.formatPattern(msg.value, null, errs);

    assert.strictEqual(val, "Foo 1");
    expect(errs).toEqual([]);
    expect(Intl.NumberFormat).toHaveBeenLastCalledWith(["en-US"], {
      minimumFractionDigits: 0,
    });
  });

  test("accepts an array of locales", function () {
    const errs = [];
    const bundle = new FluentBundle(["de", "en-US"], { useIsolating: false });
    bundle.addResource(
      new FluentResource(ftl`
      foo = Foo { 1 }
      `)
    );

    const msg = bundle.getMessage("foo");
    const val = bundle.formatPattern(msg.value, null, errs);

    assert.strictEqual(val, "Foo 1");
    expect(errs).toEqual([]);
    expect(Intl.NumberFormat).toHaveBeenLastCalledWith(["de", "en-US"], {
      minimumFractionDigits: 0,
    });
  });
});
