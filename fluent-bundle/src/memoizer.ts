type IntlCache = WeakMap<object, Record<string, object>>;

const cache = new Map<string, IntlCache>();

export function getMemoizerForLocale(locales: string | string[]): IntlCache {
  const stringLocale = Array.isArray(locales) ? locales.join(" ") : locales;
  let memoizer = cache.get(stringLocale);
  if (memoizer === undefined) {
    memoizer = new WeakMap();
    cache.set(stringLocale, memoizer);
  }

  return memoizer;
}
