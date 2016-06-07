import { LocalizationObserver } from './base';

export class ContentLocalizationObserver extends LocalizationObserver {
  getLocalizationForElement(elem) {
    return this.roots.get(document.documentElement);
  }
}
