import overlayElement from './overlay';
import Localization from './localization';

/**
 * The `DOMLocalization` class is responsible for fetching resources and
 * formatting translations.
 *
 * It implements the fallback strategy in case of errors encountered during the
 * formatting of translations and methods for observing DOM
 * trees with a `MutationObserver`.
 */
export default class DOMLocalization extends Localization {
  /**
   * @returns {DocumentLocalization}
   */
  constructor(doc, resIds, generateMessages) {
    super(doc.location.href, resIds, generateMessages);
    this.document = doc;
    this.query = '[data-l10n-id]';

    // A Set of DOM trees observed by the `MutationObserver`.
    this.roots = new Set();
    this.mutationObserver = new doc.defaultView.MutationObserver(
      mutations => this.translateMutations(mutations)
    );

    this.observerConfig = {
      attribute: true,
      characterData: false,
      childList: true,
      subtree: true,
      attributeFilter: ['data-l10n-id', 'data-l10n-args']
    };
  }

  handleEvent() {
    this.onLanguageChange();
  }

  onLanguageChange() {
    super.onLanguageChange();
    this.translateDocument();
  }

  /**
   * Set the `data-l10n-id` and `data-l10n-args` attributes on DOM elements.
   * L20n makes use of mutation observers to detect changes to `data-l10n-*`
   * attributes and translate elements asynchronously.  `setAttributes` is
   * a convenience method which allows to translate DOM elements declaratively.
   *
   * You should always prefer to use `data-l10n-id` on elements (statically in
   * HTML or dynamically via `setAttributes`) over manually retrieving
   * translations with `format`.  The use of attributes ensures that the
   * elements can be retranslated when the user changes their language
   * preferences.
   *
   * ```javascript
   * localization.setAttributes(
   *   document.querySelector('#welcome'), 'hello', { who: 'world' }
   * );
   * ```
   *
   * This will set the following attributes on the `#welcome` element.  L20n's
   * MutationObserver will pick up this change and will localize the element
   * asynchronously.
   *
   * ```html
   * <p id='welcome'
   *   data-l10n-id='hello'
   *   data-l10n-args='{"who": "world"}'>
   * </p>
   *
   * @param {Element}             element - Element to set attributes on
   * @param {string}                  id      - l10n-id string
   * @param {Object<string, string>} args    - KVP list of l10n arguments
   * ```
   */
  setAttributes(element, id, args) {
    element.setAttribute('data-l10n-id', id);
    if (args) {
      element.setAttribute('data-l10n-args', JSON.stringify(args));
    }
    return element;
  }

  /**
   * Get the `data-l10n-*` attributes from DOM elements.
   *
   * ```javascript
   * localization.getAttributes(
   *   document.querySelector('#welcome')
   * );
   * // -> { id: 'hello', args: { who: 'world' } }
   * ```
   *
   * @param   {Element}  element - HTML element
   * @returns {{id: string, args: Object}}
   */
  getAttributes(element) {
    return {
      id: element.getAttribute('data-l10n-id'),
      args: JSON.parse(element.getAttribute('data-l10n-args'))
    };
  }

  /**
   * Add `root` to the list of roots managed by this `DOMLocalization`.
   *
   * Additionally, if this `DOMLocalization` has an observer, start observing
   * `root` in order to translate mutations in it.
   *
   * @param {Element}      root - Root to observe.
   */
  connectRoot(root) {
    this.roots.add(root);
    this.mutationObserver.observe(root, this.observerConfig);
  }

  /**
   * Remove `root` from the list of roots managed by this `DOMLocalization`.
   *
   * Additionally, if this `DOMLocalization` has an observer, stop observing
   * `root`.
   *
   * Returns `true` if the root was the last one managed by this
   * `DOMLocalization`.
   *
   * @param   {Element} root - Root to disconnect.
   * @returns {boolean}
   */
  disconnectRoot(root) {
    this.roots.delete(root);
    // Pause and resume the mutation observer to stop observing `root`.
    this.pauseObserving();
    this.resumeObserving();

    return this.roots.size === 0;
  }

  /**
   * Translate all roots associated with this `DOMLocalization`.
   *
   * @returns {Promise}
   */
  translateRoots() {
    const roots = Array.from(this.roots);
    return Promise.all(
      roots.map(root => this.translateRoot(root))
    );
  }

  /**
   * Translate `root`.
   *
   * @returns {Promise}
   */
  translateRoot(root) {
    return this.translateFragment(root);
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
    for (const root of this.roots) {
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
    return this.translateRoots();
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
    return this.translateElements(this.getTranslatables(frag));
  }

  translateElements(elements) {
    if (!elements.length) {
      return Promise.resolve([]);
    }

    const keys = elements.map(this.getKeysForElement);
    return this.formatMessages(keys).then(
      translations => this.applyTranslations(elements, translations)
    );
  }

  /**
   * Translate a single DOM element asynchronously.
   *
   * The element's `data-l10n-with` must match this `DOMLocalization`'s name.
   *
   * Returns a `Promise` that gets resolved once the translation is complete.
   *
   * @param   {Element} element - HTML element to be translated
   * @returns {Promise}
   */
  translateElement(element) {
    return this.formatMessages([this.getKeysForElement(element)]).then(
      translations => this.applyTranslations([element], translations)
    );
  }

  applyTranslations(elements, translations) {
    this.pauseObserving();

    for (let i = 0; i < elements.length; i++) {
      overlayElement(elements[i], translations[i]);
    }

    this.resumeObserving();
  }

  getTranslatables(element) {
    const nodes = Array.from(element.querySelectorAll(this.query));

    if (typeof element.hasAttribute === 'function' &&
        element.hasAttribute('data-l10n-id')) {
      const elemBundleName = element.getAttribute('data-l10n-with');
      if (elemBundleName === this.name) {
        nodes.push(element);
      }
    }

    return nodes;
  }

  getKeysForElement(element) {
    return [
      element.getAttribute('data-l10n-id'),
      JSON.parse(element.getAttribute('data-l10n-args') || null)
    ];
  }
}
