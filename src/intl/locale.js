export function prioritizeLocales(def, availableLangs, requested) {
  const supportedLocales = new Set();
  for (let lang of requested) {
    if (availableLangs.has(lang)) {
      supportedLocales.add(lang);
    }
  }

  supportedLocales.add(def);
  return supportedLocales;
}

export function getDirection(code) {
  const tag = code.split('-')[0];
  return ['ar', 'he', 'fa', 'ps', 'ur'].indexOf(tag) >= 0 ?
    'rtl' : 'ltr';
}
