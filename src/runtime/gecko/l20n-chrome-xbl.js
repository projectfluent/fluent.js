import Localization from '../../lib/localization';
import { ChromeResourceBundle } from './io';

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

    const l10n = new Localization(requestBundles, createContext);
    obs.set(name, l10n);
  }

  const l10n = obs.get(name);
  obs.observeRoot(host, l10n);
  obs.translateRoot(host, l10n);
}

function destroyLocalization(name, host, obs) {
  obs.disconnectRoot(host);
}

this.createLocalization = createLocalization;
this.destroyLocalization = destroyLocalization;
