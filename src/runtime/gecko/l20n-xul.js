import { valueFromContext } from '../../lib/format';

import { ChromeLocalizationObserver } from '../../bindings/observer/chrome';
import { XULLocalization, contexts } from '../../bindings/dom/xul';

import { documentReady, getXULResourceLinks, observe } from './util';

Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://gre/modules/L10nService.jsm');
Components.utils.import('resource://gre/modules/IntlMessageContext.jsm');

function requestBundles(requestedLangs = new Set(navigator.languages)) {
  return documentReady().then(() => {
    const resIds = getXULResourceLinks(document);
    const {
      resBundles
    } = L10nService.getResources(requestedLangs, resIds);

    return resBundles;
  });
}

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

const localization = new XULLocalization(requestBundles, createContext);
localization.observe = observe;
localization.interactive.then(bundles => {
  localization.getValue = function(id, args) {
    return valueFromContext(contexts.get(bundles[0]), id, args)[0];
  };
});

Services.obs.addObserver(localization, 'language-update', false);

document.l10n = new ChromeLocalizationObserver();
document.l10n.observeRoot(document.documentElement, localization);
document.l10n.translateRoot(document.documentElement);
window.addEventListener('languagechange', document.l10n);
