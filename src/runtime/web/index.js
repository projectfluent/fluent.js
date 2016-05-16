import { fetchResource } from './io';
import { prioritizeLocales } from '../../intl/index';
import { View } from '../../bindings/html/view';

function createResourceBundle(resIds, lang) {
  return {
    lang,
    loaded: false,
    fetch() {
      return this.loaded || (this.loaded = Promise.all(
        resIds.map(id => fetchResource(id, lang))
      ));
    }
  };
}

function provider(resIds, defaultLang, availableLangs, requestedLangs) {
  const newLangs = prioritizeLocales(
    defaultLang, Object.keys(availableLangs), requestedLangs
  );

  return newLangs.map(
    lang => createResourceBundle(resIds, lang)
  );
}

document.l10n = new View(document, provider);
window.addEventListener('languagechange', document.l10n);
