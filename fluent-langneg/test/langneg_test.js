import assert from "assert";
import { negotiateLanguages } from "../src/negotiate_languages.ts";

const data = {
  filtering: {
    "exact match": [
      [["en"], ["en"], ["en"]],
      [["en-US"], ["en-US"], ["en-US"]],
      [["en-Latn-US"], ["en-Latn-US"], ["en-Latn-US"]],
      [["en-Latn-US-macos"], ["en-Latn-US-macos"], ["en-Latn-US-macos"]],
      [["rm-surmiran"], ["rm-surmiran"], ["rm-surmiran"]],
      [["de-1996"], ["de-1996"], ["de-1996"]],
      [["fr-FR"], ["de", "it", "fr-FR"], ["fr-FR"]],
      [
        ["fr", "pl", "de-DE"],
        ["pl", "en-US", "de-DE"],
        ["pl", "de-DE"],
      ],
    ],
    "available as range": [
      [["en-US"], ["en"], ["en"]],
      [["en-Latn-US"], ["en-US"], ["en-US"]],
      [["en-US-macos"], ["en-US"], ["en-US"]],
      [
        ["fr-CA", "de-DE"],
        ["fr", "it", "de"],
        ["fr", "de"],
      ],
      [["ja-JP-macos"], ["ja"], ["ja"]],
      [
        ["en-Latn-GB", "en-Latn-IN"],
        ["en-IN", "en-GB"],
        ["en-GB", "en-IN"],
      ],
    ],
    "should match on likely subtag": [
      [["en"], ["en-GB", "de", "en-US"], ["en-US", "en-GB"]],
      [
        ["en"],
        ["en-Latn-GB", "de", "en-Latn-US"],
        ["en-Latn-US", "en-Latn-GB"],
      ],
      [["fr"], ["fr-CA", "fr-FR"], ["fr-FR", "fr-CA"]],
      [["az-IR"], ["az-Latn", "az-Arab"], ["az-Arab"]],
      [["sr-RU"], ["sr-Cyrl", "sr-Latn"], ["sr-Latn"]],
      [["sr"], ["sr-Latn", "sr-Cyrl"], ["sr-Cyrl"]],
      [["zh-GB"], ["zh-Hans", "zh-Hant"], ["zh-Hant"]],
      [["sr", "ru"], ["sr-Latn", "ru"], ["ru"]],
      [["sr-RU"], ["sr-Latn-RO", "sr-Cyrl"], ["sr-Latn-RO"]],
    ],
    "should match cross-region": [
      [["en"], ["en-US"], ["en-US"]],
      [["en-US"], ["en-GB"], ["en-GB"]],
      [["en-Latn-US"], ["en-Latn-GB"], ["en-Latn-GB"]],
    ],
    "should match cross-variant": [
      [["en-US-macos"], ["en-US-windows"], ["en-US-windows"]],
    ],
    "should prioritize properly": [
      // exact match first
      [
        ["en-US"],
        ["en-US-macos", "en", "en-US"],
        ["en-US", "en", "en-US-macos"],
      ],
      // available as range second
      [["en-Latn-US"], ["en-GB", "en-US"], ["en-US", "en-GB"]],
      // likely subtags third
      [["en"], ["en-Cyrl-US", "en-Latn-US"], ["en-Latn-US"]],
      // variant range fourth
      [
        ["en-US-macos"],
        ["en-US-windows", "en-GB-macos"],
        ["en-US-windows", "en-GB-macos"],
      ],
      // regional range fifth
      [["en-US-macos"], ["en-GB-windows"], ["en-GB-windows"]],
    ],
    "should prioritize properly (extra tests)": [
      [["en-US"], ["en-GB", "en"], ["en", "en-GB"]],
      [["zh-HK"], ["zh-CN", "zh-TW"], ["zh-TW", "zh-CN"]],
    ],
    "should handle default locale properly": [
      [["fr"], ["de", "it"], []],
      [["fr"], ["de", "it"], "en-US", ["en-US"]],
      [["fr"], ["de", "en-US"], "en-US", ["en-US"]],
      [
        ["fr", "de-DE"],
        ["de-DE", "fr-CA"],
        "en-US",
        ["fr-CA", "de-DE", "en-US"],
      ],
    ],
    "should handle all matches on the 1st higher than any on the 2nd": [
      [
        ["fr-CA-macos", "de-DE"],
        ["de-DE", "fr-FR-windows"],
        ["fr-FR-windows", "de-DE"],
      ],
    ],
    "should handle cases and underscores": [
      [["fr_FR"], ["fr-FR"], ["fr-FR"]],
      [["fr_fr"], ["fr-fr"], ["fr-fr"]],
      [["fr_Fr"], ["fr-fR"], ["fr-fR"]],
      [["fr_lAtN_fr"], ["fr-Latn-FR"], ["fr-Latn-FR"]],
      [["fr_FR"], ["fr_FR"], ["fr_FR"]],
      [["fr-FR"], ["fr_FR"], ["fr_FR"]],
      [["fr_Cyrl_FR_macos"], ["fr_Cyrl_fr-macos"], ["fr_Cyrl_fr-macos"]],
    ],
    "should not crash on invalid input": [
      [null, ["fr-FR"], []],
      [undefined, ["fr-FR"], []],
      [2, ["fr-FR"], []],
      ["fr-FR", ["fr-FR"], []],
      [["fr-FR"], null, []],
      [["fr-FR"], undefined, []],
      [["fr-FR"], 2, []],
      [["fr-FR"], "fr-FR", []],
      [["2"], ["ąóżł"], []],
      [[[]], ["fr-FR"], []],
      [[[]], [[2]], []],
    ],
  },
  matching: {
    "should match only one per requested": [
      [
        ["fr", "en"],
        ["en-US", "fr-FR", "en", "fr"],
        undefined,
        "matching",
        ["fr", "en"],
      ],
    ],
  },
  lookup: {
    "should match only one": [
      [
        ["fr-FR", "en"],
        ["en-US", "fr-FR", "en", "fr"],
        "en-US",
        "lookup",
        ["fr-FR"],
      ],
    ],
  },
};

const json = JSON.stringify;

suite("Language Negotiation", () => {
  for (const strategy in data) {
    for (const groupName in data[strategy]) {
      const group = data[strategy][groupName];

      test(`${strategy} - ${groupName}`, () => {
        for (const test of group) {
          const requested = test[0];
          const available = test[1];
          const supported = test[test.length - 1];

          const result = negotiateLanguages(test[0], test[1], {
            defaultLocale: test.length > 3 ? test[2] : undefined,
            strategy: test.length > 4 ? test[3] : undefined,
          });
          assert.deepEqual(
            result,
            supported,
            `\nExpected ${json(requested)} * ${json(available)} = ${json(
              supported
            )}.\n`
          );
        }
      });
    }
  }
});
