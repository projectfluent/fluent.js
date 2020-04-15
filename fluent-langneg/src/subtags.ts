import {Locale} from "./locale";

/**
 * Below is a manually a list of likely subtags corresponding to Unicode
 * CLDR likelySubtags list.
 * This list is curated by the maintainers of Project Fluent and is
 * intended to be used in place of the full likelySubtags list in use cases
 * where full list cannot be (for example, due to the size).
 *
 * This version of the list is based on CLDR 30.0.3.
 */
const likelySubtagsMin: Record<string, string> = {
  "ar": "ar-arab-eg",
  "az-arab": "az-arab-ir",
  "az-ir": "az-arab-ir",
  "be": "be-cyrl-by",
  "da": "da-latn-dk",
  "el": "el-grek-gr",
  "en": "en-latn-us",
  "fa": "fa-arab-ir",
  "ja": "ja-jpan-jp",
  "ko": "ko-kore-kr",
  "pt": "pt-latn-br",
  "sr": "sr-cyrl-rs",
  "sr-ru": "sr-latn-ru",
  "sv": "sv-latn-se",
  "ta": "ta-taml-in",
  "uk": "uk-cyrl-ua",
  "zh": "zh-hans-cn",
  "zh-hant": "zh-hant-tw",
  "zh-hk": "zh-hant-hk",
  "zh-gb": "zh-hant-gb",
  "zh-us": "zh-hant-us",
};

const regionMatchingLangs = [
  "az",
  "bg",
  "cs",
  "de",
  "es",
  "fi",
  "fr",
  "hu",
  "it",
  "lt",
  "lv",
  "nl",
  "pl",
  "ro",
  "ru",
];

export function getLikelySubtagsMin(loc: string): Locale | null {
  if (Object.prototype.hasOwnProperty.call(likelySubtagsMin, loc)) {
    return new Locale(likelySubtagsMin[loc]);
  }
  const locale = new Locale(loc);
  if (locale.language && regionMatchingLangs.includes(locale.language)) {
    locale.region = locale.language.toUpperCase();
    return locale;
  }
  return null;
}
