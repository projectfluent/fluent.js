import { prioritizeLocales } from '../../intl/locale';
import { documentReady, getResourceLinks } from './util';
import { ResourceBundle } from './resourcebundle';
import { GeckoLocalization } from './localization';

Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://gre/modules/IntlMessageContext.jsm');

function requestBundles(requestedLangs = navigator.languages) {
  return documentReady().then(() => {
    const defaultLang = 'en-US';
    const availableLangs = ['pl', 'en-US'];
    const resIds = getResourceLinks(document.head);

    const newLangs = prioritizeLocales(
      defaultLang, availableLangs, requestedLangs
    );

    return newLangs.map(
      lang => new ResourceBundle(lang, resIds)
    );
  });
}

document.l10n = new GeckoLocalization(document, requestBundles);

window.addEventListener('languagechange', document.l10n);
Services.obs.addObserver(document.l10n, 'language-update', false);
