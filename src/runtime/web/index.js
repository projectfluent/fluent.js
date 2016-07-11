import './polyfill';
import '../../intl/polyfill';
import { prioritizeLocales } from '../../intl/locale';

import { ContentLocalizationObserver } from '../../lib/observer/content';
import { HTMLLocalization } from '../../lib/dom/html';

import { ResourceBundle } from './io';
import { documentReady, getResourceLinks, getMeta } from './util';

function createContext(lang) {
  return new Intl.MessageContext(lang);
}

document.l10n = new ContentLocalizationObserver();
window.addEventListener('languagechange', document.l10n);

documentReady().then(() => {
  const { defaultLang, availableLangs } = getMeta(document.head);
  for (let [name, resIds] of getResourceLinks(document.head)) {
    if (!document.l10n.has(name)) {
      createLocalization(name, resIds, defaultLang, availableLangs);
    }
  }
});

function createLocalization(name, resIds, defaultLang, availableLangs) {
  function requestBundles(requestedLangs = new Set(navigator.languages)) {
    const newLangs = prioritizeLocales(
      defaultLang, availableLangs, requestedLangs
    );

    const bundles = [];
    newLangs.forEach(lang => {
      bundles.push(new ResourceBundle(lang, resIds));
    });
    return Promise.resolve(bundles);
  }

  document.l10n.set(
    name, new HTMLLocalization(requestBundles, createContext)
  );

  if (name === 'main') {
    const rootElem = document.documentElement;
    document.l10n.observeRoot(rootElem, document.l10n.get(name));
    document.l10n.translateRoot(rootElem);
  }
}
