import { LocalizationObserver } from './base';

export class ContentLocalizationObserver extends LocalizationObserver {
  getLocalizationForElement(elem) {
    if (!elem.hasAttribute('data-l10n-bundle')) {
      return this.localizationsByRoot.get(document.documentElement);
    }

    return this.get(elem.getAttribute('data-l10n-bundle'));
  }
}
