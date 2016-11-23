import DOMLocalization from '../../bindings/dom_localization';
import DocumentLocalization from '../../bindings/document_localization';

import { ChromeResourceBundle } from './io';
import { documentReady, getResourceLinks } from '../web/util';

Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://gre/modules/L10nRegistry.jsm');
Components.utils.import('resource://gre/modules/IntlMessageContext.jsm');

// List of functions passed to `MessageContext` that will be available from
// within the localization entities.
//
// Example use (in FTL):
//
// open-settings = { PLATFORM() ->
//   [macos] Open Preferences
//  *[other] Open Settings
// }
const functions = {
  PLATFORM: function() {
    switch (Services.appinfo.OS) {
      case 'WINNT':
        return 'windows';
      case 'Linux':
        return 'linux';
      case 'Darwin':
        return 'macos';
      case 'Android':
        return 'android';
      default:
        return 'other';
    }
  }
};

// This function is provided to the constructor of `Localization` object and is
// used to create new `MessageContext` objects for a given `lang` with selected
// builtin functions.
function createContext(lang) {
  return new MessageContext(lang, { functions });
}

// Called for every named Localization declared via <link name=…> elements.
function createLocalization(resIds, name) {
  // This function is called by `Localization` class to retrieve an array of
  // `ResourceBundle`s. In chrome-privileged setup we use the `L10nRegistry` to
  // get this array.
  function requestBundles(requestedLangs = navigator.languages) {
    return L10nRegistry.getResources(requestedLangs, resIds).then(
      ({bundles}) => bundles.map(
        bundle => new ChromeResourceBundle(bundle.locale, bundle.resources)
      )
    );
  }

  if (name === 'main') {
    document.l10n = new DocumentLocalization(requestBundles, createContext);
    document.l10n.ready = documentReady().then(() => {
      document.l10n.connectRoot(document.documentElement);
      return document.l10n.translateDocument();
    }).then(() => {
      window.addEventListener('languagechange', document.l10n);
    });
  } else {
    // Pass the main Localization, `document.l10n`, as the observer.
    const l10n = new DOMLocalization(
      requestBundles, createContext, name, document.l10n
    );
    // Add this Localization as a delegate of the main one.
    document.l10n.delegates.set(name, l10n);
  }
}

// Collect all l10n resource links and create `Localization` objects. The
// 'main' Localization must be declared as the first one.
getResourceLinks(document.head || document).forEach(createLocalization);
