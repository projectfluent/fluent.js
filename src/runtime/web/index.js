import { fetchResource } from './io';
import { prioritizeLocales } from '../../intl/index';
import { documentReady } from '../../bindings/shims';
import { getResourceLinks, getMeta } from '../../bindings/head';
import { HTMLLocalization } from '../../bindings/html';

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

function requestBundles(requestedLangs = navigator.languages) {
  return documentReady().then(() => {
    const { defaultLang, availableLangs } = getMeta(document.head);
    const resIds = getResourceLinks(document.head);

    const newLangs = prioritizeLocales(
      defaultLang, Object.keys(availableLangs), requestedLangs
    );

    return newLangs.map(
      lang => createResourceBundle(resIds, lang)
    );
  });
}

document.l10n = new HTMLLocalization(document, requestBundles);
window.addEventListener('languagechange', document.l10n);
