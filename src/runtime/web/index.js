import { prioritizeLocales } from '../../intl/index';
import { HTMLLocalization } from '../../bindings/html';
import { ResourceBundle } from './resourcebundle';
import { documentReady, getResourceLinks, getMeta } from './util';

function requestBundles(requestedLangs = navigator.languages) {
  return documentReady().then(() => {
    const { defaultLang, availableLangs } = getMeta(document.head);
    const resIds = getResourceLinks(document.head);

    const newLangs = prioritizeLocales(
      defaultLang, Object.keys(availableLangs), requestedLangs
    );

    return newLangs.map(
      lang => new ResourceBundle(lang, resIds)
    );
  });
}

document.l10n = new HTMLLocalization(document, requestBundles);
window.addEventListener('languagechange', document.l10n);
