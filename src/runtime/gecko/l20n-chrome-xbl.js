import { XULLocalization } from '../../lib/dom/xul';
import { ChromeResourceBundle } from './io';
import { createObserve } from './util';

this.EXPORTED_SYMBOLS = ['createLocalization', 'destroyLocalization'];

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

function getRequestedLangs() {
  return Services.prefs.getComplexValue(
    'intl.accept_languages', Components.interfaces.nsIPrefLocalizedString
  ).data.split(',').map(String.trim);
}

function createLocalization(name, resIds, host, obs) {
  if (!obs.has(name)) {
    function requestBundles(requestedLangs = getRequestedLangs()) {
      return L10nRegistry.getResources(requestedLangs, resIds).then(
        ({bundles}) => bundles.map(
          bundle => new ChromeResourceBundle(bundle.locale, bundle.resources)
        )
      );
    }

    const l10n = new XULLocalization(requestBundles, createContext);
    l10n.observe = createObserve(obs);
    Services.obs.addObserver(l10n, 'language-registry-update', false);
    Services.obs.addObserver(l10n, 'language-registry-incremental', false);

    obs.set(name, l10n);
  }

  obs.observeRoot(host, obs.get(name));
  obs.translateRoot(host);
}

function destroyLocalization(name, host, obs) {
  const l10n = obs.get(name);
  const wasLast = obs.disconnectRoot(host);

  if (wasLast) {
    Services.obs.removeObserver(l10n, 'language-registry-update');
    Services.obs.removeObserver(l10n, 'language-registry-incremental');
  }
}

this.createLocalization = createLocalization;
this.destroyLocalization = destroyLocalization;
