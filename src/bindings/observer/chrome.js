import { LocalizationObserver } from './base';

export class ChromeLocalizationObserver extends LocalizationObserver {
  getLocalizationForElement(elem) {

    if (!elem.hasAttribute('data-l10n-bundle')) {
      return this.roots.get(document.documentElement);
    }

    const host = document.getBindingParent(elem);
    const bundleId = elem.getAttribute('data-l10n-bundle');

    if (host) {
      // we're inside of the anonymous content bound by XBL
      const anonbundle = document.getAnonymousElementByAttribute(
        host, 'anonid', bundleId
      );

      if (anonbundle) {
        return anonbundle.l10n;
      }
    }

    // XXX we shouldn't be using id
    return document.getElementById(bundleId).l10n;
  }
}
