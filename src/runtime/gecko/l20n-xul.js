import { documentReady, getXULResourceLinks } from './util';
import { GeckoLocalization } from './localization';

Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://gre/modules/L10nService.jsm');

function requestBundles(requestedLangs = new Set(navigator.languages)) {
  return documentReady().then(() => {
    const resIds = getXULResourceLinks(document);
    const {
      resBundles
    } = L10nService.getResources(requestedLangs, resIds);

    return resBundles;
  });
}

document.l10n = new GeckoLocalization(document, requestBundles);

window.addEventListener('languagechange', document.l10n);
Services.obs.addObserver(document.l10n, 'language-update', false);
