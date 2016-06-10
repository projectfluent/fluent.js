import { XULLocalization } from '../../lib/dom/xul';
import { observe } from './util';

this.EXPORTED_SYMBOLS = ['createXULLocalization'];

Components.utils.import('resource://gre/modules/Services.jsm');
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

this.createXULLocalization = function(requestBundles) {
  const l10n = new XULLocalization(requestBundles, createContext);
  l10n.observe = observe;
  Services.obs.addObserver(l10n, 'language-create', false);
  Services.obs.addObserver(l10n, 'language-update', false);
  return l10n;
}
