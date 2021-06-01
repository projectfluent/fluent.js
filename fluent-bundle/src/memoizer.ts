export type IntlCache = Map<object, Record<string, object>>;

const cache = new Map<string, IntlCache>();

export function getMemoizerForLocale(locales: string | string[]): IntlCache {
  const stringLocale = Array.isArray(locales) ? locales.join(" ") : locales;
  let memoizer = cache.get(stringLocale);
  if (memoizer === undefined) {
    memoizer = new Map();
    cache.set(stringLocale, memoizer);
  }

  return memoizer;
}
