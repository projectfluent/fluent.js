import '../../intl/polyfill';
import { prioritizeLocales } from '../../intl/locale';

import { ContentLocalizationObserver } from '../../bindings/observer/content';
import { HTMLLocalization } from '../../bindings/dom/html';

import { ResourceBundle } from './resourcebundle';
import { documentReady, getResourceLinks, getMeta } from './util';

function createContext(lang) {
  return new Intl.MessageContext(lang);
}

const rootElem = document.documentElement;

document.l10n = new ContentLocalizationObserver();
window.addEventListener('languagechange', document.l10n);

documentReady().then(() => {
  const { defaultLang, availableLangs } = getMeta(document.head);
  const resByName = getResourceLinks(document.head).reduce(
    (seq, [href, name]) => seq.set(name, (seq.get(name) || []).concat(href)),
    new Map()
  );

  for (let [name, resIds] of resByName) {
    createLocalization(name, resIds, defaultLang, availableLangs);
  }
});

function createLocalization(name, resIds, defaultLang, availableLangs) {
  function requestBundles(requestedLangs = new Set(navigator.languages)) {
    return Promise.resolve().then(() => {
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

  if (!document.l10n.has(name)) {
    document.l10n.set(
      name, new HTMLLocalization(requestBundles, createContext)
    );
  }

  if (name === 'main') {
    document.l10n.observeRoot(rootElem, document.l10n.get(name));
    document.l10n.translateRoot(rootElem);
  }
}
