import { XULLocalization } from '../../lib/dom/xul';
import { ChromeResourceBundle } from './io';
import { createObserve } from './util';

this.EXPORTED_SYMBOLS = ['createXULLocalization', 'ChromeResourceBundle'];

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

this.createXULLocalization = function(obs, requestBundles) {
  const l10n = new XULLocalization(requestBundles, createContext);
  l10n.observe = createObserve(obs);
  Services.obs.addObserver(l10n, 'language-registry-update', false);
  Services.obs.addObserver(l10n, 'language-registry-incremental', false);
  return l10n;
}

this.ChromeResourceBundle = ChromeResourceBundle;
