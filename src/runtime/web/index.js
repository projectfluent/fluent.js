import '../../intl/polyfill';
import { prioritizeLocales } from '../../intl/locale';

import { ContentLocalizationObserver } from '../../bindings/observer/content';
import { HTMLLocalization } from '../../bindings/dom/html';

import { ResourceBundle } from './resourcebundle';
import { documentReady, getResourceLinks, getMeta } from './util';

function requestBundles(requestedLangs = navigator.languages) {
  return documentReady().then(() => {
    const { defaultLang, availableLangs } = getMeta(document.head);
    const resIds = getResourceLinks(document.head);

    const newLangs = prioritizeLocales(
      defaultLang, Object.keys(availableLangs), requestedLangs
    );

    return newLangs.map(
      lang => new ResourceBundle(lang, resIds)
    );
  });
}

function createContext(lang) {
  return new Intl.MessageContext(lang);
}

document.l10n = new ContentLocalizationObserver();

window.addEventListener('languagechange', document.l10n);

document.l10n.observeRoot(
  document.documentElement,
  new HTMLLocalization(requestBundles, createContext)
);
document.l10n.translateRoot(document.documentElement);
