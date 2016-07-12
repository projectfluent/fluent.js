import { ChromeLocalizationObserver } from '../../lib/observer/chrome';
import { XULLocalization } from '../../lib/dom/xul';

import { ChromeResourceBundle } from './io';
import { documentReady, getResourceLinks, createObserve } from './util';

Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://gre/modules/L10nRegistry.jsm');
Components.utils.import('resource://gre/modules/IntlMessageContext.jsm');

const functions = {
  OS: function() {
    switch (Services.appinfo.OS) {
      case 'WINNT':
        return 'win';
      case 'Linux':
        return 'lin';
      case 'Darwin':
        return 'mac';
      case 'Android':
        return 'android';
      default:
        return 'other';
    }
  }
};

function createContext(lang) {
  return new MessageContext(lang, { functions });
}

document.l10n = new ChromeLocalizationObserver();
window.addEventListener('languagechange', document.l10n);

documentReady().then(() => {
  for (let [name, resIds] of getResourceLinks(document)) {
    if (!document.l10n.has(name)) {
      createLocalization(name, resIds);
    }
  }
});

function createLocalization(name, resIds) {
  function requestBundles(requestedLangs = navigator.languages) {
    return L10nRegistry.getResources(requestedLangs, resIds).then(
      ({bundles}) => bundles.map(
        bundle => new ChromeResourceBundle(bundle.locale, bundle.resources)
      )
    );
  }

  const l10n = new XULLocalization(requestBundles, createContext);
  l10n.observe = createObserve(document.l10n);
  Services.obs.addObserver(l10n, 'language-registry-update', false);
  Services.obs.addObserver(l10n, 'language-registry-incremental', false);

  document.l10n.set(name, l10n);

  if (name === 'main') {
    const rootElem = document.documentElement;
    document.l10n.observeRoot(rootElem, l10n);
    document.l10n.translateRoot(rootElem);
  }
}
