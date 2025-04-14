const languageCodeRe = "([a-z]{2,3}|\\*)";
const extendedCodeRe = "((?:-(?:[a-z]{3})){1,3})";
const scriptCodeRe = "(?:-([a-z]{4}|\\*))";
const regionCodeRe = "(?:-([a-z]{2}|[0-9]{3}|\\*))";
const variantCodeRe = "(?:-(([0-9][a-z0-9]{3}|[a-z0-9]{5,8})|\\*))";
const extensionCodeRe = "(-(?:[a-wy-z])(?:-[a-z]{2,8})+)";
const privateCodeRe = "(?:-x((?:-[a-z]{2,8})+))";

/**
 * Regular expression splitting locale id into multiple pieces:
 *
 * Example: `en-Latn-US-macos`
 *
 * language: en
 * script:   Latn
 * region:   US
 * variant:  macos
 *
 * It can also accept a range `*` character on any position.
 */
const localeRe = new RegExp(
  `^${languageCodeRe}${extendedCodeRe}?${scriptCodeRe}?` +
    `${regionCodeRe}?${variantCodeRe}?${extensionCodeRe}*${privateCodeRe}?$`,
  "i"
);

export class Locale {
  isWellFormed: boolean;
  language?: string;
  extended: string[] = [];
  script?: string;
  region?: string;
  variant?: string;
  extension: Map<string, string> = new Map();
  priv?: string;

  /**
   * Parses a locale id using the localeRe into an array with four elements.
   *
   * If the second argument `range` is set to true, it places range `*` char
   * in place of any missing piece.
   *
   * It also allows skipping the script section of the id, so `en-US` is
   * properly parsed as `en-*-US-*`.
   */
  constructor(locale: string) {
    const result = localeRe.exec(locale.replace(/_/g, "-"));
    if (!result) {
      this.isWellFormed = false;
      return;
    }

    let [, language, extended, script, region, variant, extension, priv] =
      result;

    if (language) {
      this.language = language.toLowerCase();
    }
    if (extended) {
      this.extended = extended.substring(1).toLowerCase().split("-");
    }
    if (script) {
      this.script = script[0].toUpperCase() + script.slice(1);
    }
    if (region) {
      this.region = region.toUpperCase();
    }
    if (extension) {
      for (const [, type, code] of extension.matchAll(
        /(?:-([a-wy-z])((?:-[a-z]{2,8})+))/g
      )) {
        this.extension.set(type.toLowerCase(), code.substring(1).toLowerCase());
      }
    }
    if (priv) {
      this.priv = priv.substring(1).toLowerCase();
    }
    this.variant = variant;
    this.isWellFormed = true;
  }

  isEqual(other: Locale): boolean {
    return (
      this.language === other.language &&
      this.extended.every((v, i) => v === other.extended[i]) &&
      this.script === other.script &&
      this.region === other.region &&
      this.variant === other.variant &&
      compareMap(this.extension, other.extension) &&
      this.priv === other.priv
    );
  }

  matches(other: Locale, thisRange = false, otherRange = false): boolean {
    return (
      (this.language === other.language ||
        (thisRange && this.language === undefined) ||
        (otherRange && other.language === undefined)) &&
      (this.extended.every((v, i) => v === other.extended[i]) ||
        (thisRange && this.extended.length === 0) ||
        (otherRange && other.extended.length === 0)) &&
      (this.script === other.script ||
        (thisRange && this.script === undefined) ||
        (otherRange && other.script === undefined)) &&
      (this.region === other.region ||
        (thisRange && this.region === undefined) ||
        (otherRange && other.region === undefined)) &&
      (this.variant === other.variant ||
        (thisRange && this.variant === undefined) ||
        (otherRange && other.variant === undefined)) &&
      (compareMap(this.extension, other.extension) ||
        (thisRange && this.extension.size === 0) ||
        (otherRange && other.extension.size === 0)) &&
      (this.priv === other.priv ||
        (thisRange && this.priv === undefined) ||
        (otherRange && other.priv === undefined))
    );
  }

  toString(): string {
    const xSubtag = this.priv === undefined ? undefined : `x-${this.priv}`;
    return [
      this.language,
      ...this.extended,
      this.script,
      this.region,
      this.variant,
      ...[...this.extension.entries()].flat(),
      xSubtag,
    ]
      .filter(part => part !== undefined)
      .join("-");
  }

  clearVariants(): void {
    this.variant = undefined;
  }

  clearRegion(): void {
    this.region = undefined;
  }

  addLikelySubtags(): boolean {
    const newLocale = getLikelySubtagsMin(this.toString().toLowerCase());
    if (newLocale) {
      this.language = newLocale.language;
      this.extended = newLocale.extended;
      this.script = newLocale.script;
      this.region = newLocale.region;
      this.variant = newLocale.variant;
      this.extension = newLocale.extension;
      this.priv = newLocale.priv;
      return true;
    }
    return false;
  }
}

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
  ar: "ar-arab-eg",
  "az-arab": "az-arab-ir",
  "az-ir": "az-arab-ir",
  be: "be-cyrl-by",
  da: "da-latn-dk",
  el: "el-grek-gr",
  en: "en-latn-us",
  fa: "fa-arab-ir",
  ja: "ja-jpan-jp",
  ko: "ko-kore-kr",
  pt: "pt-latn-br",
  sr: "sr-cyrl-rs",
  "sr-ru": "sr-latn-ru",
  sv: "sv-latn-se",
  ta: "ta-taml-in",
  uk: "uk-cyrl-ua",
  zh: "zh-hans-cn",
  "zh-hant": "zh-hant-tw",
  "zh-hk": "zh-hant-hk",
  "zh-mo": "zh-hant-mo",
  "zh-tw": "zh-hant-tw",
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

function getLikelySubtagsMin(loc: string): Locale | null {
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

function compareMap<K, V>(map1: Map<K, V>, map2: Map<K, V>): boolean {
  if (map1.size !== map2.size) {
    return false;
  }

  for (const [key, value] of map1) {
    const other = map2.get(key);
    if (other !== value || (other === undefined && !map2.has(key))) {
      return false;
    }
  }

  return true;
}
