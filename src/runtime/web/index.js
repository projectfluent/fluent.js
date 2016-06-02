import '../../intl/polyfill';

import { prioritizeLocales } from '../../intl/locale';
import { Localization } from '../../bindings/html';
import { ResourceBundle } from './resourcebundle';
import { documentReady, getResourceLinks, getMeta } from './util';

function requestBundles(requestedLangs = new Set(navigator.languages)) {
  return documentReady().then(() => {
    const { defaultLang, availableLangs } = getMeta(document.head);
    const resIds = getResourceLinks(document.head);

    const newLangs = prioritizeLocales(
      defaultLang, availableLangs, requestedLangs
    );

    const bundles = [];
    newLangs.forEach(lang => {
      bundles.push(new ResourceBundle(lang, resIds));
    });
    return bundles;
  });
}

function createContext(lang) {
  return new Intl.MessageContext(lang);
}

document.l10n = new Localization(document, requestBundles, createContext);
window.addEventListener('languagechange', document.l10n);
