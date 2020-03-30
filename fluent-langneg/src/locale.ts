/* eslint no-magic-numbers: 0 */

import {getLikelySubtagsMin} from "./subtags";

const languageCodeRe = "([a-z]{2,3}|\\*)";
const scriptCodeRe = "(?:-([a-z]{4}|\\*))";
const regionCodeRe = "(?:-([a-z]{2}|\\*))";
const variantCodeRe = "(?:-(([0-9][a-z0-9]{3}|[a-z0-9]{5,8})|\\*))";

/**
 * Regular expression splitting locale id into four pieces:
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
  `^${languageCodeRe}${scriptCodeRe}?${regionCodeRe}?${variantCodeRe}?$`, "i");

export class Locale {
  isWellFormed: boolean;
  language?: string;
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
    const result = localeRe.exec(locale.replace(/_/g, "-"));
    if (!result) {
      this.isWellFormed = false;
      return;
    }

    let [, language, script, region, variant] = result;

    if (language) {
      this.language = language.toLowerCase();
    }
    if (script) {
      this.script = script[0].toUpperCase() + script.slice(1);
    }
    if (region) {
      this.region = region.toUpperCase();
    }
    this.variant = variant;
    this.isWellFormed = true;
  }

  isEqual(other: Locale): boolean {
    return this.language === other.language
      && this.script === other.script
      && this.region === other.region
      && this.variant === other.variant;
  }

  matches(other: Locale, thisRange = false, otherRange = false): boolean {
    return (this.language === other.language
        || thisRange && this.language === undefined
        || otherRange && other.language === undefined)
      && (this.script === other.script
        || thisRange && this.script === undefined
        || otherRange && other.script === undefined)
      && (this.region === other.region
        || thisRange && this.region === undefined
        || otherRange && other.region === undefined)
      && (this.variant === other.variant
        || thisRange && this.variant === undefined
        || otherRange && other.variant === undefined);
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
