import { LocalizationObserver } from './base';

export class ChromeLocalizationObserver extends LocalizationObserver {
  translateRootContent(root) {
    const anonChildren = document.getAnonymousNodes(root);
    if (!anonChildren) {
      return this.translateFragment(root);
    }

    return Promise.all(
      [root, ...anonChildren].map(node => this.translateFragment(node))
    );
  }
}
