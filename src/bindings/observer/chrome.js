import { LocalizationObserver } from './base';

export class ChromeLocalizationObserver extends LocalizationObserver {
  getLocalizationForElement(elem) {
    if (!elem.hasAttribute('data-l10n-bundle')) {
      return this.roots.get(document.documentElement);
    }

    return this.get(elem.getAttribute('data-l10n-bundle'));
  }

  // XXX translateRoot needs to look into the anonymous content
}

