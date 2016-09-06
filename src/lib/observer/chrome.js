import { LocalizationObserver } from './base';

function markEnd() {
  performance.mark('l20n: end translateRootContent');
  performance.measure(
    'l20n: translateRootContent',
    'l20n: start translateRootContent',
    'l20n: end translateRootContent'
  );
}

export class ChromeLocalizationObserver extends LocalizationObserver {
  translateRootContent(root) {
    performance.mark('l20n: start translateRootContent');
    const anonChildren = document.getAnonymousNodes(root);
    if (!anonChildren) {
      return this.translateFragment(root).then(markEnd);
    }

    return Promise.all(
      [root, ...anonChildren].map(node => this.translateFragment(node))
    ).then(markEnd);
  }
}
