'use strict';

export function prioritizeLocales(def, availableLangs, requested) {
  let supportedLocale;
  // Find the first locale in the requested list that is supported.
  for (let i = 0; i < requested.length; i++) {
    const locale = requested[i];
    if (availableLangs.indexOf(locale) !== -1) {
      supportedLocale = locale;
      break;
    }
  }
  if (!supportedLocale ||
      supportedLocale === def) {
    return [def];
  }

  return [supportedLocale, def];
}
