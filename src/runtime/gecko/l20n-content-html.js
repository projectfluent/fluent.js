import '../../intl/polyfill';

import Localization from '../../lib/localization';
import LocalizationObserver from '../../bindings/dom';

import { postMessage, ContentResourceBundle } from './io';
import { documentReady, getResourceLinks } from '../web/util';

function createContext(lang) {
  return new Intl.MessageContext(lang);
}

document.l10n = new LocalizationObserver();
window.addEventListener('languagechange', document.l10n);

for (const [name, resIds] of getResourceLinks(document.head)) {
  if (!document.l10n.has(name)) {
    createLocalization(name, resIds);
  }
}

function createLocalization(name, resIds) {
  function requestBundles(requestedLangs = navigator.languages) {
    return postMessage('getResources', {
      requestedLangs, resIds
    }).then(
      ({bundles}) => bundles.map(
        bundle => new ContentResourceBundle(bundle.locale, bundle.resources)
      )
    );
  }

  const l10n = new Localization(requestBundles, createContext);
  document.l10n.set(name, l10n);

  if (name === 'main') {
    documentReady().then(() => {
      const rootElem = document.documentElement;
      document.l10n.observeRoot(rootElem, l10n);
      document.l10n.translateRoot(rootElem, l10n);
    });
  }
}
