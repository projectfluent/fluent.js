import '../../intl/polyfill';
import { prioritizeLocales } from '../../intl/locale';

import { ContentLocalizationObserver } from '../../lib/observer/content';
import { HTMLLocalization } from '../../lib/dom/html';

import { documentReady, getResourceLinks, postMessage, ResourceBundle }
  from './util';

function createContext(lang) {
  return new Intl.MessageContext(lang);
}

document.l10n = new ContentLocalizationObserver();
window.addEventListener('languagechange', document.l10n);

documentReady().then(() => {
  for (let [name, resIds] of getResourceLinks(document.head)) {
    if (!document.l10n.has(name)) {
      createLocalization(name, resIds);
    }
  }
});

function createLocalization(name, resIds) {
  function requestBundles(requestedLangs = navigator.languages) {
    return postMessage('getResources', {
      requestedLangs, resIds
    }).then(
      ({bundles}) => bundles.map(
        bundle => new ResourceBundle(bundle.locale, bundle.resources)
      )
    );
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
