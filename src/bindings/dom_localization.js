import { getDirection } from '../intl/locale';
import Localization from '../lib/localization';
import overlayElement from './overlay';

// A regexp to sanitize HTML tags and entities.
const reHtml = /[&<>]/g;
const htmlEntities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

/**
 * The `DOMLocalization` class localizes DOM trees.
 */
export default class DOMLocalization extends Localization {
  /**
   * @param   {Function}             requestBundles
   * @param   {Function}             createContext
   * @param   {string}               name
   * @param   {DocumentLocalization} [observer]
   * @returns {DOMLocalization}
   */
  constructor(requestBundles, createContext, name, observer) {
    super(requestBundles, createContext);

    this.name = name;
    this.query = `[data-l10n-with=${name}]`;
    this.roots = new Set();
    this.observer = observer;
  }

  handleEvent() {
    return this.requestLanguages();
  }

  /**
   * Trigger the language negotation process with an array of language codes.
   * Returns a promise with the negotiated array of language objects as above.
   *
   * ```javascript
   * localization.requestLanguages(['de-DE', 'de', 'en-US']);
   * ```
   *
   * @param   {Array<string>} requestedLangs - array of requested languages
   * @returns {Promise<Array<string>>}
   */
  requestLanguages(requestedLangs) {
    super.requestLanguages(requestedLangs).then(
      () => this.translateRoots()
    );
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

    if (this.observer) {
      this.observer.observeRoot(root);
    }
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

    if (this.observer) {
      this.observer.unobserveRoot(root);
    }

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
   * This is similar to `translateFragment` but it will also set the `lang` and
   * `dir` attribute on `root`.  In XUL documents, the anonymous content
   * attached to `root` will also be translated.
   *
   * @returns {Promise}
   */
  translateRoot(root) {
    return this.translateRootContent(root).then(
      () => this.interactive
    ).then(bundles => {
      const langs = bundles.map(bundle => bundle.lang);
      const wasLocalizedBefore = root.hasAttribute('langs');

      root.setAttribute('langs', langs.join(' '));
      root.setAttribute('lang', langs[0]);
      root.setAttribute('dir', getDirection(langs[0]));

      if (wasLocalizedBefore) {
        root.dispatchEvent(new CustomEvent('DOMRetranslated', {
          bubbles: false,
          cancelable: false,
        }));
      }
    });
  }

  translateRootContent(root) {
    const anonChildren = document.getAnonymousNodes ?
      document.getAnonymousNodes(root) : null;
    if (!anonChildren) {
      return this.translateFragment(root);
    }

    return Promise.all(
      [root, ...anonChildren].map(node => this.translateFragment(node))
    );
  }

  /**
   * Translate a DOM element or fragment asynchronously.
   *
   * Manually trigger the translation (or re-translation) of a DOM fragment.
   * Use the `data-l10n-id` and `data-l10n-args` attributes to mark up the DOM
   * with information about which translations to use.  Only elements with
   * `data-l10n-with` attribute matching this `DOMLocalization`'s name will be
   * translated.
   *
   * Returns a `Promise` that gets resolved once the translation is complete.
   *
   * @param   {DOMFragment} frag - DOMFragment to be translated
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
    return this.formatEntities(keys).then(
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
    return this.formatEntities([this.getKeysForElement(element)]).then(
      translations => this.applyTranslations([element], translations)
    );
  }

  applyTranslations(elements, translations) {
    if (this.observer) {
      this.observer.pauseObserving();
    }

    for (let i = 0; i < elements.length; i++) {
      overlayElement(elements[i], translations[i]);
    }

    if (this.observer) {
      this.observer.resumeObserving();
    }
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
      // In XUL documents missing attributes return `''` here which breaks
      // JSON.parse.  HTML documents return `null`.
      JSON.parse(element.getAttribute('data-l10n-args') || null)
    ];
  }

  /**
   * Sanitize arguments.
   *
   * Escape HTML tags and entities in string-typed arguments.
   *
   * @param   {Object} args
   * @returns {Object}
   * @private
   */
  sanitizeArgs(args) {
    for (const name in args) {
      const arg = args[name];
      if (typeof arg === 'string') {
        args[name] = arg.replace(reHtml, match => htmlEntities[match]);
      }
    }
    return args;
  }
}
