import { LocalizationObserver } from './base';

export class ContentLocalizationObserver extends LocalizationObserver {
  getLocalizationForElement() {
    return this.localizationsByRoot.get(document.documentElement);
  }
}
