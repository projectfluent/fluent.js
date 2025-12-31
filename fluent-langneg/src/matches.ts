import { LocaleWrapper } from "./locale.js";

/**
 * Negotiates the languages between the list of requested locales against
 * a list of available locales.
 *
 * The algorithm is based on the BCP4647 3.3.2 Extended Filtering algorithm,
 * with several modifications:
 *
 * ### 1. Available locales are treated as ranges
 *
 * This change allows us to match a more specific request against
 * more generic available locale.
 *
 * For example, if the available locale list provides locale `en`,
 * and the requested locale is `en-US`, we treat the available locale as
 * a locale that matches all possible english requests.
 *
 * This means that we expect available locale ID to be as precize as
 * the matches they want to cover.
 *
 * For example, if there is only `sr` available, it's ok to list
 * it in available locales. But once the available locales has both,
 * Cyrl and Latn variants, the locale IDs should be `sr-Cyrl` and `sr-Latn`
 * to avoid any `sr-*` request to match against whole `sr` range.
 *
 * What it does ([requested] * [available] = [supported]):
 *
 *     ['en-US'] * ['en'] = ['en']
 *
 * ### 2. Likely subtags from LDML 4.3 Likely Subtags has been added
 *
 * The most obvious likely subtag that can be computed is a duplication
 * of the language field onto region field (`fr` => `fr-FR`).
 *
 * On top of that, likely subtags may use a list of mappings, that
 * allow the algorithm to handle non-obvious matches.
 * For example, making sure that we match `en` to `en-US` or `sr` to
 * `sr-Cyrl`, while `sr-RU` to `sr-Latn-RU`.
 *
 * This list can be taken directly from CLDR Supplemental Data.
 *
 * What it does ([requested] * [available] = [supported]):
 *
 *     ['fr'] * ['fr-FR'] = ['fr-FR']
 *     ['en'] * ['en-US'] = ['en-US']
 *     ['sr'] * ['sr-Latn', 'sr-Cyrl'] = ['sr-Cyrl']
 *
 * ### 3. Variant/region range check has been added
 *
 * Lastly, the last form of check is against the requested locale ID
 * but with the variant/region field replaced with a `*` range.
 *
 * The rationale here laid out in LDML 4.4 Language Matching:
 *   "(...) normally the fall-off between the user's languages is
 *   substantially greated than regional variants."
 *
 * In other words, if we can't match for the given region, maybe
 * we can match for the same language/script but other region, and
 * it will in most cases be preferred over falling back on the next
 * language.
 *
 * What it does ([requested] * [available] = [supported]):
 *
 *     ['en-AU'] * ['en-US'] = ['en-US']
 *     ['sr-RU'] * ['sr-Latn-RO'] = ['sr-Latn-RO'] // sr-RU -> sr-Latn-RU
 *
 * It works similarly to getParentLocales algo, except that we stop
 * after matching against variant/region ranges and don't try to match
 * ignoring script ranges. That means that `sr-Cyrl` will never match
 * against `sr-Latn`.
 */
export function filterMatches(
  requestedLocales: Array<string>,
  availableLocales: Array<string>,
  strategy: string
): Array<string> {
  const supportedLocales = new Set<string>();
  const availableLocalesMap = new Map<string, LocaleWrapper>();

  for (let locale of availableLocales) {
    try {
      availableLocalesMap.set(locale, new LocaleWrapper(locale));
    } catch {}
  }

  outer: for (const reqTag of requestedLocales) {
    let requested: LocaleWrapper;
    try {
      requested = new LocaleWrapper(reqTag);
    } catch {
      continue;
    }

    // 1) Attempt to make an exact match
    // Example: `en-US` === `en-US`
    const reqTagLowerCase = reqTag.toLowerCase();
    for (const key of availableLocalesMap.keys()) {
      if (reqTagLowerCase === key.toLowerCase()) {
        supportedLocales.add(key);
        availableLocalesMap.delete(key);
        switch (strategy) {
          case "lookup":
            break outer;
          case "filtering":
            continue;
          default:
            continue outer;
        }
      }
    }

    const reqVariants = requested.variants;

    // 2) Attempt to match against the available range
    // Example: ['en-US'] * ['en'] = ['en']
    for (const [key, available] of availableLocalesMap) {
      if (
        languagesMatch(available, requested, false) &&
        scriptsMatch(available, requested, false) &&
        regionsMatch(available, requested, false) &&
        (available.variants === reqVariants || available.variants === undefined)
      ) {
        supportedLocales.add(key);
        availableLocalesMap.delete(key);
        switch (strategy) {
          case "lookup":
            break outer;
          case "filtering":
            continue;
          default:
            continue outer;
        }
      }
    }

    // 3) Attempt to retrieve a maximal version of the requested locale ID
    // It'll expand `en` into `en-Latn-US` and `zh` into `zh-Hans-CN`.
    // Example: ['en'] * ['en-GB', 'en-US'] = ['en-US']
    requested = requested.maximize();

    for (const [key, available] of availableLocalesMap) {
      if (
        languagesMatch(available, requested, false) &&
        scriptsMatch(available, requested, false) &&
        regionsMatch(available, requested, false) &&
        (available.variants === reqVariants || available.variants === undefined)
      ) {
        supportedLocales.add(key);
        availableLocalesMap.delete(key);
        switch (strategy) {
          case "lookup":
            break outer;
          case "filtering":
            continue;
          default:
            continue outer;
        }
      }
    }

    // 4) Attempt to look up for a different variant for the same locale ID
    // Example: ['en-US-mac'] * ['en-US-win'] = ['en-US-win']
    for (const [key, available] of availableLocalesMap) {
      if (
        languagesMatch(available, requested, true) &&
        scriptsMatch(available, requested, true) &&
        regionsMatch(available, requested, true)
      ) {
        supportedLocales.add(key);
        availableLocalesMap.delete(key);
        switch (strategy) {
          case "lookup":
            break outer;
          case "filtering":
            continue;
          default:
            continue outer;
        }
      }
    }

    // 5) Attempt to match against the likely subtag without region
    // In the example below, maximize() will turn
    // `zh-Hant` into `zh-Hant-TW` giving `zh-TW` priority match
    // over `zh-CN`.
    //
    // Example: ['zh-Hant-HK'] * ['zh-TW', 'zh-CN'] = ['zh-TW']
    requested = new Intl.Locale(requested.language, {
      script: requested.script,
    }).maximize();

    for (const [key, available] of availableLocalesMap) {
      if (
        languagesMatch(available, requested, false) &&
        scriptsMatch(available, requested, false) &&
        regionsMatch(available, requested, false)
      ) {
        supportedLocales.add(key);
        availableLocalesMap.delete(key);
        switch (strategy) {
          case "lookup":
            break outer;
          case "filtering":
            continue;
          default:
            continue outer;
        }
      }
    }

    // 6) Attempt to look up for a different region for the same locale ID
    // Example: ['en-US'] * ['en-AU'] = ['en-AU']
    for (const [key, available] of availableLocalesMap) {
      if (
        languagesMatch(available, requested, true) &&
        scriptsMatch(available, requested, true)
      ) {
        supportedLocales.add(key);
        availableLocalesMap.delete(key);
        switch (strategy) {
          case "lookup":
            break outer;
          case "filtering":
            continue;
          default:
            continue outer;
        }
      }
    }
  }

  return Array.from(supportedLocales);
}

function languagesMatch(
  a: Intl.Locale,
  b: Intl.Locale,
  range = false
): boolean {
  return (
    a.language === b.language ||
    a.language === "und" ||
    (range && b.language === "und")
  );
}

function scriptsMatch(a: Intl.Locale, b: Intl.Locale, range = false): boolean {
  return (
    a.script === b.script ||
    a.script === undefined ||
    (range && b.script === undefined)
  );
}

function regionsMatch(a: Intl.Locale, b: Intl.Locale, range = false): boolean {
  return (
    a.region === b.region ||
    a.region === undefined ||
    (range && b.region === undefined)
  );
}
