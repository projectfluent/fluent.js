/* eslint no-magic-numbers: 0 */

const languageCodeRe = '([a-z]{2,3}|\\*)';
const scriptCodeRe = '(?:-([a-z]{4}|\\*))';
const regionCodeRe = '(?:-([a-z]{2}|\\*))';
const variantCodeRe = '(?:-([a-z]+|\\*))';

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
`^${languageCodeRe}${scriptCodeRe}?${regionCodeRe}?${variantCodeRe}?$`, 'i');

export const localeParts = ['language', 'script', 'region', 'variant'];

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
  constructor(locale, range = false) {
    const result = localeRe.exec(locale);
    if (!result) {
      return;
    }

    const missing = range ? '*' : undefined;

    const language = result[1] || missing;
    const script = result[2] || missing;
    const region = result[3] || missing;
    const variant = result[4] || missing;

    this.language = language;
    this.script = script;
    this.region = region;
    this.variant = variant;
  }

  isEqual(locale) {
    return localeParts.every(part => this[part] === locale[part]);
  }

  matches(locale) {
    return localeParts.every(part => {
      return this[part] === '*' || locale[part] === '*' ||
        (this[part] === undefined && locale[part] === undefined) ||
        (this[part] !== undefined && locale[part] !== undefined &&
        this[part].toLowerCase() === locale[part].toLowerCase());
    });
  }
}
