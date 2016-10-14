import LocalizationObserver from './base';

function markEnd() {
  performance.mark('l20n: end translateRootContent');
  performance.measure(
    'l20n: translateRootContent',
    'l20n: start translateRootContent',
    'l20n: end translateRootContent'
  );
}

/**
 * The `ChromeLocalizationObserver` is an extension of a `LocalizationObserver`
 * class which additionally collects all XBL binding nodes for translation.
 *
 * This API is useful for chrome-privileged HTML and XUL in Gecko.
 */
export default class ChromeLocalizationObserver extends LocalizationObserver {
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
