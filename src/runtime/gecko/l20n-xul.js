import { prioritizeLocales } from '../../intl/locale';
import { contexts, Localization } from '../../bindings/html';
import { documentReady, getXULResourceLinks } from './util';
import { valueFromContext } from '../../lib/format';
import { ResourceBundle } from './resourcebundle';

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

function requestBundles(requestedLangs = navigator.languages) {
  return documentReady().then(() => {
    const defaultLang = 'en-US';
    const availableLangs = ['en-US'];
    const resIds = getXULResourceLinks(document);

    const newLangs = prioritizeLocales(
      defaultLang, availableLangs, requestedLangs
    );

    return newLangs.map(
      lang => new ResourceBundle(lang, resIds)
    );
  });
}

function createContext(lang) {
  return new MessageContext(lang, { functions });
}

document.l10n = new Localization(document, requestBundles, createContext);

document.l10n.interactive.then(bundles => {
  document.l10n.getValue = function(id, args) {
    return valueFromContext(
      contexts.get(bundles[0]), id, args
    )[0];
  };
});

window.addEventListener('languagechange', document.l10n);
