/* eslint no-magic-numbers: 0 */

import { getLikelySubtagsMin } from "./subtags";

const languageCodeRe = "([a-z]{2,3}|\\*)";
const scriptCodeRe = "(?:-([a-z]{4}|\\*))";
const regionCodeRe = "(?:-([a-z]{2}|\\*))";
const variantCodeRe = "(?:-([a-z]{3}|\\*))";

/**
 * Regular expression splitting locale id into four pieces:
 *
 * Example: `en-Latn-US-mac`
 *
 * language: en
 * script:   Latn
 * region:   US
 * variant:  mac
 *
 * It can also accept a range `*` character on any position.
 */
const localeRe = new RegExp(
  `^${languageCodeRe}${scriptCodeRe}?${regionCodeRe}?${variantCodeRe}?$`, "i");

export const localeParts = ["language", "script", "region", "variant"];

export default class Locale {
  /**
   * Parses a locale id using the localeRe into an array with four elements.
   *
   * If the second argument `range` is set to true, it places range `*` char
   * in place of any missing piece.
   *
   * It also allows skipping the script section of the id, so `en-US` is
   * properly parsed as `en-*-US-*`.
   */
  constructor(locale) {
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

  isEqual(locale) {
    return localeParts.every(part => this[part] === locale[part]);
  }

  matches(locale, thisRange = false, otherRange = false) {
    return localeParts.every(part => {
      return ((thisRange && this[part] === undefined) ||
              (otherRange && locale[part] === undefined) ||
              this[part] === locale[part]);
    });
  }

  toString() {
    return localeParts
      .map(part => this[part])
      .filter(part => part !== undefined)
      .join("-");
  }

  clearVariants() {
    this.variant = undefined;
  }

  clearRegion() {
    this.region = undefined;
  }

  addLikelySubtags() {
    const newLocale = getLikelySubtagsMin(this.toString().toLowerCase());

    if (newLocale) {
      localeParts.forEach(part => this[part] = newLocale[part]);
      return true;
    }
    return false;
  }
}
