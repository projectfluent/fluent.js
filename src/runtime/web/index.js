import { prioritizeLocales } from '../../intl/index';
import { HTMLLocalization } from '../../bindings/html';
import { documentReady, getResourceLinks, getMeta } from './util';
import { fetchResource } from './io';

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
