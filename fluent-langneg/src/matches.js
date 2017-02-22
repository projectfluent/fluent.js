/* eslint no-magic-numbers: 0 */
/* eslint complexity: ["error", { "max": 22 }] */

import Locale from './locale';
import { getLikelySubtagsMin } from './subtags';

/**
 * Attempts to build a most likely maximum version of the locale id based
 * on it's minimal version.
 *
 * If possible it uses the lookup table above. If this one is missing,
 * it only attempts to place the language code in the region position.
 */
function getLikelySubtagsLocale(loc, likelySubtags) {
  if (likelySubtags) {
    for (const key of Object.keys(likelySubtags)) {
      if (key.toLowerCase() === loc.toLowerCase()) {
        return new Locale(likelySubtags[key]);
      }
    }
    return null;
  }
  return getLikelySubtagsMin(loc);
}

/**
 * Replaces the region position with a range to allow for matches
 * with the same language/script but from different region.
 */
function regionRangeFor(locale) {
  locale.region = '*';
  return locale;
}

function variantRangeFor(locale) {
  locale.variant = '*';
  return locale;
}

function getOrParseLocaleRange(localeStr, cache) {
  if (!cache.has(localeStr)) {
    cache.set(localeStr, new Locale(localeStr, true));
  }
  return cache.get(localeStr);
}
/**
 * Negotiates the languages between the list of requested locales against
 * a list of available locales.
 *
 * The algorithm is based on the BCP4647 3.3.2 Extended Filtering algorithm,
 * with several modifications:
 *
 *  1) available locales are treated as ranges
 *
 *    This change allows us to match a more specific request against
 *    more generic available locale.
 *
 *    For example, if the available locale list provides locale `en`,
 *    and the requested locale is `en-US`, we treat the available locale as
 *    a locale that matches all possible english requests.
 *
 *    This means that we expect available locale ID to be as precize as
 *    the matches they want to cover.
 *
 *    For example, if there is only `sr` available, it's ok to list
 *    it in available locales. But once the available locales has both,
 *    Cyrl and Latn variants, the locale IDs should be `sr-Cyrl` and `sr-Latn`
 *    to avoid any `sr-*` request to match against whole `sr` range.
 *
 *    What it does ([requested] * [available] = [supported]):
 *
 *    ['en-US'] * ['en'] = ['en']
 *
 *  2) likely subtags from LDML 4.3 Likely Subtags has been added
 *
 *    The most obvious likely subtag that can be computed is a duplication
 *    of the language field onto region field (`fr` => `fr-FR`).
 *
 *    On top of that, likely subtags may use a list of mappings, that
 *    allow the algorithm to handle non-obvious matches.
 *    For example, making sure that we match `en` to `en-US` or `sr` to
 *    `sr-Cyrl`, while `sr-RU` to `sr-Latn-RU`.
 *
 *    This list can be taken directly from CLDR Supplemental Data.
 *
 *    What it does ([requested] * [available] = [supported]):
 *
 *    ['fr'] * ['fr-FR'] = ['fr-FR']
 *    ['en'] * ['en-US'] = ['en-US']
 *    ['sr'] * ['sr-Latn', 'sr-Cyrl'] = ['sr-Cyrl']
 *
 *  3) variant/region range check has been added
 *
 *    Lastly, the last form of check is against the requested locale ID
 *    but with the variant/region field replaced with a `*` range.
 *
 *    The rationale here laid out in LDML 4.4 Language Matching:
 *      "(...) normally the fall-off between the user's languages is
 *      substantially greated than regional variants."
 *
 *    In other words, if we can't match for the given region, maybe
 *    we can match for the same language/script but other region, and
 *    it will in most cases be preferred over falling back on the next
 *    language.
 *
 *    What it does ([requested] * [available] = [supported]):
 *
 *    ['en-AU'] * ['en-US'] = ['en-US']
 *    ['sr-RU'] * ['sr-Latn-RO'] = ['sr-Latn-RO'] // sr-RU -> sr-Latn-RU
 *
 *    It works similarly to getParentLocales algo, except that we stop
 *    after matching against variant/region ranges and don't try to match
 *    ignoring script ranges. That means that `sr-Cyrl` will never match
 *    against `sr-Latn`.
 */
export default function filterMatches(
  requestedLocales, availableLocales, strategy, likelySubtags
) {
  const supportedLocales = new Set();

  const availableLocalesCache = new Map();

  outer:
  for (const reqLocStr of requestedLocales) {
    if (strategy === 'lookup' && supportedLocales.size > 0) {
      return Array.from(supportedLocales);
    }

    const reqLocStrLC = reqLocStr.toLowerCase();

    // Attempt to make an exact match
    // Example: `en-US` === `en-US`
    for (const availableLocale of availableLocales) {
      if (reqLocStrLC === availableLocale.toLowerCase()) {
        supportedLocales.add(availableLocale);
        if (strategy !== 'matching') {
          continue outer;
        }
      }
    }

    const requestedLocale = new Locale(reqLocStrLC);

    // Attempt to match against the available range
    // This turns `en` into `en-*-*-*` and `en-US` into `en-*-US-*`
    // Example: ['en-US'] * ['en'] = ['en']
    for (const availableLocale of availableLocales) {
      if (requestedLocale.matches(
        getOrParseLocaleRange(availableLocale, availableLocalesCache)
      )) {
        supportedLocales.add(availableLocale);
        if (strategy !== 'matching') {
          continue outer;
        }
      }
    }

    // Attempt to retrieve a maximal version of the requested locale ID
    // If data is available, it'll expand `en` into `en-Latn-US` and
    // `zh` into `zh-Hans-CN`.
    // Example: ['en'] * ['en-GB', 'en-US'] = ['en-US']
    const maxRequestedLocale =
      getLikelySubtagsLocale(reqLocStrLC, likelySubtags);

    if (maxRequestedLocale) {
      for (const availableLocale of availableLocales) {
        if (maxRequestedLocale.matches(
          getOrParseLocaleRange(availableLocale, availableLocalesCache)
        )) {
          supportedLocales.add(availableLocale);
          if (strategy !== 'matching') {
            continue outer;
          }
        }
      }
    }

    // Attempt to look up for a different variant for the same locale ID
    // Example: ['en-US-mac'] * ['en-US-win'] = ['en-US-win']
    const variantRange = variantRangeFor(maxRequestedLocale || requestedLocale);

    for (const availableLocale of availableLocales) {
      if (variantRange.matches(
        getOrParseLocaleRange(availableLocale, availableLocalesCache)
      )) {
        supportedLocales.add(availableLocale);
        if (strategy !== 'matching') {
          continue outer;
        }
      }
    }

    // Attempt to look up for a different region for the same locale ID
    // Example: ['en-US'] * ['en-AU'] = ['en-AU']
    const regionRange = regionRangeFor(variantRange);

    for (const availableLocale of availableLocales) {
      if (regionRange.matches(
        getOrParseLocaleRange(availableLocale, availableLocalesCache)
      )) {
        supportedLocales.add(availableLocale);
        if (strategy !== 'matching') {
          continue outer;
        }
      }
    }
  }

  return Array.from(supportedLocales);
}
