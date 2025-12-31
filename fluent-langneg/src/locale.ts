function convertMasks(locale: string): string {
  let result;
  if (locale[0] === "*") {
    result = `und${locale.substring(1)}`;
  } else {
    result = locale;
  }
  return result.replace(/-\*/g, "");
}

function getVisibleLangTagLength(
  language: string,
  script: string | undefined,
  region: string | undefined
): number {
  let result = 0;
  result += language ? language.length : "und".length;
  result += script ? script.length + 1 : 0;
  result += region ? region.length + 1 : 0;
  return result;
}

function getExtensionStart(locale: string): number | undefined {
  let pos = locale.search(/-[a-zA-Z]-/);
  if (pos === -1) {
    return undefined;
  }
  return pos;
}

export class Locale {
  isWellFormed: boolean;
  language: string;
  script?: string;
  region?: string;
  variant?: string;

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
    let result;
    let normalized = convertMasks(locale.replace(/_/g, "-"));
    try {
      result = new Intl.Locale(normalized);
    } catch {
      this.isWellFormed = false;
      this.language = "und";
      return;
    }

    this.language = result.language;
    this.script = result.script;
    this.region = result.region;

    let visiblelangTagLength = getVisibleLangTagLength(
      this.language,
      this.script,
      this.region
    );

    if (normalized.length > visiblelangTagLength) {
      let extStart = getExtensionStart(locale);
      this.variant = locale.substring(visiblelangTagLength + 1, extStart);
    }

    this.isWellFormed = true;
  }

  matches(other: Locale, thisRange = false, otherRange = false): boolean {
    return (
      this.isWellFormed &&
      other.isWellFormed &&
      (this.language === other.language ||
        (thisRange && this.language === "und") ||
        (otherRange && other.language === "und")) &&
      (this.script === other.script ||
        (thisRange && this.script === undefined) ||
        (otherRange && other.script === undefined)) &&
      (this.region === other.region ||
        (thisRange && this.region === undefined) ||
        (otherRange && other.region === undefined)) &&
      (this.variant === other.variant ||
        (thisRange && this.variant === undefined) ||
        (otherRange && other.variant === undefined))
    );
  }

  toString(): string {
    return [this.language, this.script, this.region, this.variant]
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
      this.script = newLocale.script;
      this.region = newLocale.region;
      this.variant = newLocale.variant;
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
