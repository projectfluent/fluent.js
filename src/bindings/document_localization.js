import { L10nError } from '../lib/errors';

import DOMLocalization from './dom_localization';

/**
 * The `DocumentLocalization` class localizes DOM documents.
 *
 * A sublcass of `DOMLocalization`, it implements methods for observing DOM
 * trees with a `MutationObserver`.  It can delegate the translation of DOM
 * elements marked with `data-l10n-with` to other named `DOMLocalizations`.
 *
 * Each `document` will have its corresponding `DocumentLocalization` instance
 * created automatically on startup, as `document.l10n`.
 */
export default class DocumentLocalization extends DOMLocalization {
  /**
   * @returns {DocumentLocalization}
   */
  constructor(requestBundles, createContext) {
    // There can be only one `DocumentLocalization` per document and it's
    // always called 'main'.
    super(requestBundles, createContext, 'main');

    // Localize elements with no explicit `data-l10n-with` too.
    this.query =
      '[data-l10n-with="main"], [data-l10n-id]:not([data-l10n-with])';

    // A map of named delegate `DOMLocalization` objects.
    this.delegates = new Map();

    // Used by `DOMLocalization` when connecting/disconnecting roots and for
    // pausing the `MutationObserver` when translations are applied to the DOM.
    // `DocumentLocalization` is its own observer because it implements
    // `observeRoot`, `unobserveRoot`, `pauseObserving` and `resumeObserving`.
    this.observer = this;

    // A Set of DOM trees observed by the `MutationObserver`.
    this.observedRoots = new Set();
    this.mutationObserver = new MutationObserver(
      mutations => this.translateMutations(mutations)
    );

    this.observerConfig = {
      attributes: true,
      characterData: false,
      childList: true,
      subtree: true,
      attributeFilter: ['data-l10n-id', 'data-l10n-args', 'data-l10n-with']
    };
  }

  /**
   * Trigger the language negotation process for this `DocumentLocalization`
   * and any `DOMLocalization` objects which it can delegate to.
   *
   * Returns a promise which resolves to an array of arrays of negotiated
   * languages for each `Localization` available in the current document.
   *
   * ```javascript
   * document.l10n.requestLanguages(['de-DE', 'de', 'en-US']);
   * ```
   *
   * @param   {Array<string>} requestedLangs - array of requested languages
   * @returns {Promise<Array<Array<string>>>}
   */
  requestLanguages(requestedLangs) {
    const requests = [
      super.requestLanguages(requestedLangs)
    ].concat(
      Array.from(
        this.delegates.values(),
        delegate => delegate.requestLanguages(requestedLangs)
      )
    );

    return Promise.all(requests).then(
      () => this.translateDocument()
    );
  }

  /**
   * Starting observing `root` with the `MutationObserver`.
   *
   * @private
   */
  observeRoot(root) {
    this.observedRoots.add(root);
    this.mutationObserver.observe(root, this.observerConfig);
  }

  /**
   * Stop observing `root` with the `MutationObserver`.
   *
   * @private
   */
  unobserveRoot(root) {
    this.observedRoots.delete(root);
    // Pause and resume the mutation observer to stop observing `root`.
    this.pauseObserving();
    this.resumeObserving();
  }

  /**
   * Pauses the `MutationObserver`.
   *
   * @private
   */
  pauseObserving() {
    this.mutationObserver.disconnect();
  }

  /**
   * Resumes the `MutationObserver`.
   *
   * @private
   */
  resumeObserving() {
    for (const root of this.observedRoots) {
      this.mutationObserver.observe(root, this.observerConfig);
    }
  }

  /**
   * Translate mutations detected by the `MutationObserver`.
   *
   * The elements in the mutations can use `data-l10n-with` to specify which
   * `DOMLocalization` should be used for translating them.
   *
   * @private
   */
  translateMutations(mutations) {
    for (const mutation of mutations) {
      switch (mutation.type) {
        case 'attributes':
          this.translateElement(mutation.target);
          break;
        case 'childList':
          for (const addedNode of mutation.addedNodes) {
            if (addedNode.nodeType === addedNode.ELEMENT_NODE) {
              if (addedNode.childElementCount) {
                this.translateFragment(addedNode);
              } else if (addedNode.hasAttribute('data-l10n-id')) {
                this.translateElement(addedNode);
              }
            }
          }
          break;
      }
    }
  }

  /**
   * Triggers translation of all roots associated with this
   * `DocumentLocalization` and any `DOMLocalization` objects which it can
   * delegate to.
   *
   * Returns a `Promise` which is resolved once all translations are
   * completed.
   *
   * @returns {Promise}
   */
  translateDocument() {
    const localizations = [this, ...this.delegates.values()];
    return Promise.all(
      localizations.map(
        l10n => l10n.translateRoots()
      )
    );
  }

  /**
   * Translate a DOM element or fragment asynchronously using this
   * `DocumentLocalization` and any `DOMLocalization` objects which it can
   * delegate to.
   *
   * Manually trigger the translation (or re-translation) of a DOM fragment.
   * Use the `data-l10n-id` and `data-l10n-args` attributes to mark up the DOM
   * with information about which translations to use.  Only elements with
   * `data-l10n-with` attribute matching this `DOMLocalization`'s name will be
   * translated.
   *
   * If `frag` or its descendants use `data-l10n-with`, the specific named
   * `DOMLocalization` will be used to translate it.  As a special case,
   * elements without `data-l10n-with` will be localized using this
   * `DocumentLocalization` (as if they had `data-l10n-with="main"`).
   *
   * Returns a `Promise` that gets resolved once the translation is complete.
   *
   * @param   {DOMFragment} frag - Element or DocumentFragment to be translated
   * @returns {Promise}
   */
  translateFragment(frag) {
    const requests = [
      super.translateFragment(frag)
    ].concat(
      Array.from(
        this.delegates.values(),
        delegate => delegate.translateFragment(frag)
      )
    );

    return Promise.all(requests);
  }

  /**
   * Translate a single DOM element asynchronously using this
   * `DocumentLocalization` or any `DOMLocalization` objects which it can
   * delegate to.
   *
   * If `element` uses `data-l10n-with`, the specific named `DOMLocalization`
   * will be used to translate it.  As a special case, an element without
   * `data-l10n-with` will be localized using this `DocumentLocalization` (as
   * if it had `data-l10n-with="main"`).
   *
   * Returns a `Promise` that gets resolved once the translation is complete.
   *
   * @param   {Element} element - HTML element to be translated
   * @returns {Promise}
   */
  translateElement(element) {
    const name = element.getAttribute('data-l10n-with');

    let l10n;
    if (!name || name === 'main') {
      l10n = this;
    } else if (this.delegates.has(name)) {
      l10n = this.delegates.get(name);
    } else {
      const err = new L10nError(`Unknown Localization: ${name}.`);
      return Promise.reject(err);
    }

    return l10n.formatEntities([l10n.getKeysForElement(element)]).then(
      translations => l10n.applyTranslations([element], translations)
    );
  }

  getTranslatables(element) {
    const nodes = Array.from(element.querySelectorAll(this.query));

    if (typeof element.hasAttribute === 'function' &&
        element.hasAttribute('data-l10n-id')) {
      const elemBundleName = element.getAttribute('data-l10n-with');
      if (!elemBundleName || elemBundleName === this.name) {
        nodes.push(element);
      }
    }

    return nodes;
  }
}
