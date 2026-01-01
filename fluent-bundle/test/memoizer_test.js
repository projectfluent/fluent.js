import assert from "assert";
import { getMemoizerForLocale } from "../esm/memoizer.js";

suite("Memoizer", function () {
  test("returns same instance for same locale", function () {
    const memoizer1 = getMemoizerForLocale("en");
    const memoizer2 = getMemoizerForLocale("en");
    assert.strictEqual(memoizer1, memoizer2);
  });

  test("returns different instance for different locale", function () {
    const memoizer1 = getMemoizerForLocale("en");
    const memoizer2 = getMemoizerForLocale("uk");
    assert.notStrictEqual(memoizer1, memoizer2);
  });

  test("works with array of locales", function () {
    const memoizer1 = getMemoizerForLocale(["en"]);
    const memoizer2 = getMemoizerForLocale(["en"]);
    assert.strictEqual(memoizer1, memoizer2);
  });

  test("works with string and array of locales", function () {
    const memoizer1 = getMemoizerForLocale(["en"]);
    const memoizer2 = getMemoizerForLocale("en");
    assert.strictEqual(memoizer1, memoizer2);
  });
});
