import './polyfill';
import '../../intl/polyfill';
import { prioritizeLocales } from '../../intl/locale';

import DOMLocalization from '../../bindings/dom_localization';
import DocumentLocalization from '../../bindings/document_localization';

import { ResourceBundle } from './io';
import { documentReady, getResourceLinks, getMeta } from './util';

// This function is provided to the constructor of `Localization` object and is
// used to create new `MessageContext` objects for a given `lang` with selected
// builtin functions.
function createContext(lang) {
  return new Intl.MessageContext(lang);
}

// Called for every named Localization declared via <link name=…> elements.
function createLocalization(defaultLang, availableLangs, resIds, name) {
  // This function is called by `Localization` class to retrieve an array of
  // `ResourceBundle`s.
  function requestBundles(requestedLangs = new Set(navigator.languages)) {
    const newLangs = prioritizeLocales(
      defaultLang, availableLangs, requestedLangs
    );

    const bundles = Array.from(
      newLangs, lang => new ResourceBundle(lang, resIds)
    );

    return Promise.resolve(bundles);
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

const { defaultLang, availableLangs } = getMeta(document.head);

// Collect all l10n resource links and create `Localization` objects. The
// 'main' Localization must be declared as the first one.
getResourceLinks(document.head).forEach(
  (resIds, name) => createLocalization(
    defaultLang, availableLangs, resIds, name
  )
);
