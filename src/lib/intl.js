'use strict';

export function prioritizeLocales(def, availableLangs, requested) {
  var supportedLocale;
  // Find the first locale in the requested list that is supported.
  for (var i = 0; i < requested.length; i++) {
    var locale = requested[i];
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
