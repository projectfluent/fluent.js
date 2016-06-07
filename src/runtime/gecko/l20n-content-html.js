import '../../intl/polyfill';
import { prioritizeLocales } from '../../intl/locale';

import { ContentLocalizationObserver } from '../../bindings/observer/content';
import { HTMLLocalization } from '../../bindings/dom/html';

import { ResourceBundle } from '../web/resourcebundle';
import { documentReady, getResourceLinks, getMeta } from './util';

function requestBundles(requestedLangs = new Set(navigator.languages)) {
  return documentReady().then(() => {
    const { defaultLang, availableLangs } = getMeta(document.head);
    const resIds = getResourceLinks(document.head);

    const newLangs = prioritizeLocales(
      defaultLang, availableLangs, requestedLangs
    );

    const bundles = [];
    newLangs.forEach(lang => {
      bundles.push(new ResourceBundle(lang, resIds));
    });
    return bundles;
  });
}

function createContext(lang) {
  return new Intl.MessageContext(lang);
}

const localization = new HTMLLocalization(requestBundles, createContext);

document.l10n = new ContentLocalizationObserver();
document.l10n.observeRoot(document.documentElement, localization);
document.l10n.translateRoot(document.documentElement);
window.addEventListener('languagechange', document.l10n);
