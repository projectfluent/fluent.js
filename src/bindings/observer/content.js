import { LocalizationObserver } from './base';

export class ContentLocalizationObserver extends LocalizationObserver {
  getLocalizationForElement() {
    return this.roots.get(document.documentElement);
  }
}
