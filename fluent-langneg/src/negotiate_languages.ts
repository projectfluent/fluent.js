import { filterMatches } from "./matches.js";

export interface NegotiateLanguagesOptions {
  strategy?: "filtering" | "matching" | "lookup";
  defaultLocale?: string;
}

/**
 * Negotiates the languages between the list of requested locales against
 * a list of available locales.
 *
 * It accepts three arguments:
 *
 *   requestedLocales:
 *     an Array of strings with BCP47 locale IDs sorted
 *     according to user preferences.
 *
 *   availableLocales:
 *     an Array of strings with BCP47 locale IDs of locale for which
 *     resources are available. Unsorted.
 *
 *   options:
 *     An object with the following, optional keys:
 *
 *       strategy: 'filtering' (default) | 'matching' | 'lookup'
 *
 *       defaultLocale:
 *         a string with BCP47 locale ID to be used
 *         as a last resort locale.
 *
 *
 * It returns an Array of strings with BCP47 locale IDs sorted according to the
 * user preferences.
 *
 * The exact list will be selected differently depending on the strategy:
 *
 *   'filtering': (default)
 *     In the filtering strategy, the algorithm will attempt to match
 *     as many keys in the available locales in order of the requested locales.
 *
 *   'matching':
 *     In the matching strategy, the algorithm will attempt to find the
 *     best possible match for each element of the requestedLocales list.
 *
 *   'lookup':
 *     In the lookup strategy, the algorithm will attempt to find a single
 *     best available locale based on the requested locales list.
 *
 *     This strategy requires defaultLocale option to be set.
 */
export function negotiateLanguages(
  requestedLocales: Readonly<Array<string>>,
  availableLocales: Readonly<Array<string>>,
  { strategy = "filtering", defaultLocale }: NegotiateLanguagesOptions = {}
): Array<string> {
  const supportedLocales = filterMatches(
    Array.from(requestedLocales ?? []).map(String),
    Array.from(availableLocales ?? []).map(String),
    strategy
  );

  if (strategy === "lookup") {
    if (defaultLocale === undefined) {
      throw new Error(
        "defaultLocale cannot be undefined for strategy `lookup`"
      );
    }
    if (supportedLocales.length === 0) {
      supportedLocales.push(defaultLocale);
    }
  } else if (defaultLocale && !supportedLocales.includes(defaultLocale)) {
    supportedLocales.push(defaultLocale);
  }

  return supportedLocales;
}
