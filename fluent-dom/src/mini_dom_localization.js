import translateElement from "./overlay.js";
import Localization from "./localization.js";

export const L10NID_ATTR_NAME = "data-l10n-id";
export const L10NARGS_ATTR_NAME = "data-l10n-args";

const L10N_ELEMENT_QUERY = `[${L10NID_ATTR_NAME}]`;

/**
 * The `MiniDOMLocalization` class translates DOM elements marked with
 * `data-l10n-id` and `data-l10n-args` attributes.
 *
 * Unlike `DOMLocalization`, it doesn't observe the DOM: it's up to the caller
 * to call `translateFragment` or `translateElements` when elements are added
 * or their `data-l10n-*` attributes change. Roots connected with `connectRoot`
 * are only retranslated when the language changes, through `onChange`.
 *
 * This makes it a good fit for applications built with a component framework
 * that already has a rendering lifecycle, where a `MutationObserver` per
 * component would be too costly.
 */
export default class MiniDOMLocalization extends Localization {
  /**
   * @param {Array<String>}    resourceIds     - List of resource IDs
   * @param {Function}         generateBundles - Function that returns a
   *                                             generator over FluentBundles
   * @returns {MiniDOMLocalization}
   */
  constructor(resourceIds, generateBundles) {
    super(resourceIds, generateBundles);

    // A Set of DOM trees retranslated on language change.
    this.roots = new Set();
  }

  onChange(eager = false) {
    super.onChange(eager);
    // The base constructor calls onChange before `roots` is initialized.
    if (this.roots) {
      this.translateRoots();
    }
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
      id: element.getAttribute(L10NID_ATTR_NAME),
      args: JSON.parse(element.getAttribute(L10NARGS_ATTR_NAME) || null),
    };
  }

  /**
   * Add `newRoot` to the list of roots managed by this `MiniDOMLocalization`.
   *
   * Connected roots are retranslated when the language changes.
   *
   * @param {Element | DocumentFragment} newRoot - Root to connect.
   */
  connectRoot(newRoot) {
    this.roots.add(newRoot);
  }

  /**
   * Remove `root` from the list of roots managed by this
   * `MiniDOMLocalization`.
   *
   * Returns `true` if the root was the last one managed by this
   * `MiniDOMLocalization`.
   *
   * @param   {Element | DocumentFragment} root - Root to disconnect.
   * @returns {boolean}
   */
  disconnectRoot(root) {
    this.roots.delete(root);
    return this.roots.size === 0;
  }

  /**
   * Translate all roots associated with this `MiniDOMLocalization`.
   *
   * @returns {Promise}
   */
  translateRoots() {
    const roots = Array.from(this.roots);
    return Promise.all(roots.map(root => this.translateFragment(root)));
  }

  /**
   * Translate a DOM element or fragment asynchronously using this
   * `MiniDOMLocalization` object.
   *
   * Manually trigger the translation (or re-translation) of a DOM fragment.
   * Use the `data-l10n-id` and `data-l10n-args` attributes to mark up the DOM
   * with information about which translations to use.
   *
   * Returns a `Promise` that gets resolved once the translation is complete.
   *
   * @param   {Element | DocumentFragment} frag - Element or DocumentFragment to be translated
   * @returns {Promise}
   */
  translateFragment(frag) {
    return this.translateElements(this.getTranslatables(frag));
  }

  /**
   * Translate a list of DOM elements asynchronously using this
   * `MiniDOMLocalization` object.
   *
   * Manually trigger the translation (or re-translation) of a list of elements.
   * Use the `data-l10n-id` and `data-l10n-args` attributes to mark up the DOM
   * with information about which translations to use.
   *
   * Returns a `Promise` that gets resolved once the translation is complete.
   *
   * @param   {Array<Element>} elements - List of elements to be translated
   * @returns {Promise}
   */
  async translateElements(elements) {
    if (!elements.length) {
      return undefined;
    }

    const keys = elements.map(element => this.getAttributes(element));
    const translations = await this.formatMessages(keys);
    return this.applyTranslations(elements, translations);
  }

  /**
   * Applies translations onto elements.
   *
   * @param {Array<Element>} elements
   * @param {Array<Object>}  translations
   * @protected
   */
  applyTranslations(elements, translations) {
    for (let i = 0; i < elements.length; i++) {
      if (translations[i] !== undefined) {
        translateElement(elements[i], translations[i]);
      }
    }
  }

  /**
   * Collects all translatable child elements of the element.
   *
   * @param {Element | DocumentFragment} element
   * @returns {Array<Element>}
   * @protected
   */
  getTranslatables(element) {
    const nodes = Array.from(element.querySelectorAll(L10N_ELEMENT_QUERY));

    if (
      typeof element.hasAttribute === "function" &&
      element.hasAttribute(L10NID_ATTR_NAME)
    ) {
      nodes.push(element);
    }

    return nodes;
  }
}
