import { ChromeLocalizationObserver } from '../../bindings/observer/chrome';
import { HTMLLocalization } from '../../bindings/dom/html';

import { documentReady, getResourceLinks } from './util';

Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://gre/modules/L10nService.jsm');
Components.utils.import('resource://gre/modules/IntlMessageContext.jsm');

function requestBundles(requestedLangs = new Set(navigator.languages)) {
  return documentReady().then(() => {
    const resIds = getResourceLinks(document.head);
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

const name = Symbol.for('anonymous l10n');
const rootElem = document.documentElement;

document.l10n = new ChromeLocalizationObserver();

if (!document.l10n.has(name)) {
  document.l10n.set(name, new HTMLLocalization(requestBundles, createContext));
}

document.l10n.observeRoot(rootElem, document.l10n.get(name));
document.l10n.translateRoot(rootElem);

window.addEventListener('languagechange', document.l10n);
