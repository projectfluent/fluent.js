import { LocalizationObserver } from './base';

export class ContentLocalizationObserver extends LocalizationObserver {
  getLocalizationForElement(elem) {
    // check data-l10n-bundle
    return Array.from(this.roots.values())[0];
  }
}
