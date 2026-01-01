import assert from "assert";
import { acceptedLanguages } from "../esm/accepted_languages.js";

suite("parse headers", () => {
  test("without quality values", () => {
    assert.deepStrictEqual(acceptedLanguages("en-US, fr, pl"), [
      "en-US",
      "fr",
      "pl",
    ]);
    assert.deepStrictEqual(acceptedLanguages("sr-Latn"), ["sr-Latn"]);
  });

  test("with quality values", () => {
    assert.deepStrictEqual(
      acceptedLanguages("fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5"),
      ["fr-CH", "fr", "en", "de", "*"]
    );
  });

  test("with out of order quality values", () => {
    assert.deepStrictEqual(
      acceptedLanguages("en;q=0.8, fr;q=0.9, de;q=0.7, *;q=0.5, fr-CH"),
      ["fr-CH", "fr", "en", "de", "*"]
    );
  });

  test("with equal q values", () => {
    assert.deepStrictEqual(
      acceptedLanguages("en;q=0.1, fr;q=0.1, de;q=0.1, *;q=0.1"),
      ["en", "fr", "de", "*"]
    );
  });

  test("with duff q values", () => {
    assert.deepStrictEqual(
      acceptedLanguages(
        "en;q=no, fr;z=0.9, de;q=0.7;q=9, *;q=0.5, fr-CH;q=a=0.1"
      ),
      ["fr", "fr-CH", "de", "*", "en"]
    );
  });

  test("with empty entries", () => {
    assert.deepStrictEqual(
      acceptedLanguages("en;q=0.8,,, fr;q=0.9,, de;q=0.7, *;q=0.5, fr-CH"),
      ["fr-CH", "fr", "en", "de", "*"]
    );
  });

  test("edge cases", () => {
    const args = [null, NaN, Infinity, [], {}];

    args.forEach(arg => {
      assert.throws(acceptedLanguages.bind(null, arg), TypeError);
    });
  });
});
