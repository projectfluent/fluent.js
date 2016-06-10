import { LocalizationObserver } from './base';

export class ContentLocalizationObserver extends LocalizationObserver {
  translateRootContent(root) {
    return this.translateFragment(root);
  }
}
