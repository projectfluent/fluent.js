import assert from "assert";
import ftl from "@fluent/dedent";

import { FluentBundle } from "../esm/bundle.js";
import { FluentResource } from "../esm/resource.js";

suite("Reference bombs", function () {
  let bundle, args, errs;

  setup(function () {
    errs = [];
  });

  suite("Billion Laughs", function () {
    suiteSetup(function () {
      bundle = new FluentBundle("en-US", { useIsolating: false });
      bundle.addResource(
        new FluentResource(ftl`
        lol0 = LOL
        lol1 = {lol0} {lol0} {lol0} {lol0} {lol0} {lol0} {lol0} {lol0} {lol0} {lol0}
        lol2 = {lol1} {lol1} {lol1} {lol1} {lol1} {lol1} {lol1} {lol1} {lol1} {lol1}
        lol3 = {lol2} {lol2} {lol2} {lol2} {lol2} {lol2} {lol2} {lol2} {lol2} {lol2}
        lol4 = {lol3} {lol3} {lol3} {lol3} {lol3} {lol3} {lol3} {lol3} {lol3} {lol3}
        lol5 = {lol4} {lol4} {lol4} {lol4} {lol4} {lol4} {lol4} {lol4} {lol4} {lol4}
        lol6 = {lol5} {lol5} {lol5} {lol5} {lol5} {lol5} {lol5} {lol5} {lol5} {lol5}
        lol7 = {lol6} {lol6} {lol6} {lol6} {lol6} {lol6} {lol6} {lol6} {lol6} {lol6}
        lol8 = {lol7} {lol7} {lol7} {lol7} {lol7} {lol7} {lol7} {lol7} {lol7} {lol7}
        lol9 = {lol8} {lol8} {lol8} {lol8} {lol8} {lol8} {lol8} {lol8} {lol8} {lol8}
        lolz = {lol9}
        `)
      );
    });

    test("does not expand all placeables", function () {
      const msg = bundle.getMessage("lolz");
      const val = bundle.formatPattern(msg.value, args, errs);
      assert.strictEqual(val, "{???}");
      assert.strictEqual(errs.length, 1);
      assert.ok(errs[0] instanceof RangeError);
    });

    test("throws when errors are undefined", function () {
      const msg = bundle.getMessage("lolz");
      assert.throws(
        () => bundle.formatPattern(msg.value),
        RangeError,
        "Too many characters in placeable"
      );
    });
  });
});
