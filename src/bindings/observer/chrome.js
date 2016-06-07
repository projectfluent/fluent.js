import { LocalizationObserver } from './base';

export class ChromeLocalizationObserver extends LocalizationObserver {
  getLocalizationForElement(elem) {

    if (!elem.hasAttribute('data-l10n-bundle')) {
      return this.roots.get(document.documentElement);
    }

    return document.l10n.get(elem.getAttribute('data-l10n-bundle'));
  }
}
