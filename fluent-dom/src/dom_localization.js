import MiniDOMLocalization, {
  L10NID_ATTR_NAME,
  L10NARGS_ATTR_NAME,
} from "./mini_dom_localization.js";

/**
 * The `DOMLocalization` class is responsible for fetching resources and
 * formatting translations.
 *
 * It implements the fallback strategy in case of errors encountered during the
 * formatting of translations and methods for observing DOM
 * trees with a `MutationObserver`.
 *
 * See `MiniDOMLocalization` for a variant without the `MutationObserver`.
 */
export default class DOMLocalization extends MiniDOMLocalization {
  /**
   * @param {Array<String>}    resourceIds     - List of resource IDs
   * @param {Function}         generateBundles - Function that returns a
   *                                             generator over FluentBundles
   * @returns {DOMLocalization}
   */
  constructor(resourceIds, generateBundles) {
    super(resourceIds, generateBundles);

    // requestAnimationFrame handler.
    this.pendingrAF = null;
    // list of elements pending for translation.
    this.pendingElements = new Set();
    this.windowElement = null;
    this.mutationObserver = null;

    this.observerConfig = {
      attributes: true,
      characterData: false,
      childList: true,
      subtree: true,
      attributeFilter: [L10NID_ATTR_NAME, L10NARGS_ATTR_NAME],
    };
  }

  /**
   * Set the `data-l10n-id` and `data-l10n-args` attributes on DOM elements.
   * FluentDOM makes use of mutation observers to detect changes
   * to `data-l10n-*` attributes and translate elements asynchronously.
   * `setAttributes` is a convenience method which allows to translate
   * DOM elements declaratively.
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
   * This will set the following attributes on the `#welcome` element.
   * The MutationObserver will pick up this change and will localize the element
   * asynchronously.
   *
   * ```html
   * <p id='welcome'
   *   data-l10n-id='hello'
   *   data-l10n-args='{"who": "world"}'>
   * </p>
   * ```
   *
   * @param {Element}                element - Element to set attributes on
   * @param {string}                 id      - l10n-id string
   * @param {Object<string, string>} args    - KVP list of l10n arguments
   * @returns {Element}
   */
  setAttributes(element, id, args) {
    element.setAttribute(L10NID_ATTR_NAME, id);
    if (args) {
      element.setAttribute(L10NARGS_ATTR_NAME, JSON.stringify(args));
    } else {
      element.removeAttribute(L10NARGS_ATTR_NAME);
    }
    return element;
  }

  /**
   * Add `newRoot` to the list of roots managed by this `DOMLocalization`.
   *
   * Additionally, if this `DOMLocalization` has an observer, start observing
   * `newRoot` in order to translate mutations in it.
   *
   * @param {Element | DocumentFragment}      newRoot - Root to observe.
   */
  connectRoot(newRoot) {
    for (const root of this.roots) {
      if (
        root === newRoot ||
        root.contains(newRoot) ||
        newRoot.contains(root)
      ) {
        throw new Error("Cannot add a root that overlaps with existing root.");
      }
    }

    if (this.windowElement) {
      if (this.windowElement !== newRoot.ownerDocument.defaultView) {
        throw new Error(`Cannot connect a root:
          DOMLocalization already has a root from a different window.`);
      }
    } else {
      this.windowElement = newRoot.ownerDocument.defaultView;
      this.mutationObserver = new this.windowElement.MutationObserver(
        mutations => this.translateMutations(mutations)
      );
    }

    super.connectRoot(newRoot);
    this.mutationObserver.observe(newRoot, this.observerConfig);
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
   * @param   {Element | DocumentFragment} root - Root to disconnect.
   * @returns {boolean}
   */
  disconnectRoot(root) {
    const wasLast = super.disconnectRoot(root);
    // Pause the mutation observer to stop observing `root`.
    this.pauseObserving();

    if (wasLast) {
      this.mutationObserver = null;
      if (this.windowElement && this.pendingrAF) {
        this.windowElement.cancelAnimationFrame(this.pendingrAF);
      }
      this.windowElement = null;
      this.pendingrAF = null;
      this.pendingElements.clear();
      return true;
    }

    // Resume observing all other roots.
    this.resumeObserving();
    return false;
  }

  /**
   * Pauses the `MutationObserver`.
   */
  pauseObserving() {
    if (!this.mutationObserver) {
      return;
    }

    this.translateMutations(this.mutationObserver.takeRecords());
    this.mutationObserver.disconnect();
  }

  /**
   * Resumes the `MutationObserver`.
   */
  resumeObserving() {
    if (!this.mutationObserver) {
      return;
    }

    for (const root of this.roots) {
      this.mutationObserver.observe(root, this.observerConfig);
    }
  }

  /**
   * Translate mutations detected by the `MutationObserver`.
   *
   * @private
   */
  translateMutations(mutations) {
    for (const mutation of mutations) {
      switch (mutation.type) {
        case "attributes":
          if (mutation.target.hasAttribute("data-l10n-id")) {
            this.pendingElements.add(mutation.target);
          }
          break;
        case "childList":
          for (const addedNode of mutation.addedNodes) {
            if (addedNode.nodeType === addedNode.ELEMENT_NODE) {
              if (addedNode.childElementCount) {
                for (const element of this.getTranslatables(addedNode)) {
                  this.pendingElements.add(element);
                }
              } else if (addedNode.hasAttribute(L10NID_ATTR_NAME)) {
                this.pendingElements.add(addedNode);
              }
            }
          }
          break;
      }
    }

    // This fragment allows us to coalesce all pending translations
    // into a single requestAnimationFrame.
    if (this.pendingElements.size > 0) {
      if (this.pendingrAF === null) {
        this.pendingrAF = this.windowElement.requestAnimationFrame(() => {
          this.translateElements(Array.from(this.pendingElements));
          this.pendingElements.clear();
          this.pendingrAF = null;
        });
      }
    }
  }

  /**
   * Applies translations onto elements.
   *
   * @param {Array<Element>} elements
   * @param {Array<Object>}  translations
   * @protected
   */
  applyTranslations(elements, translations) {
    this.pauseObserving();
    super.applyTranslations(elements, translations);
    this.resumeObserving();
  }

  /**
   * Get the `data-l10n-*` attributes from DOM elements as a two-element
   * array.
   *
   * @deprecated Use `getAttributes` instead.
   * @param {Element} element
   * @returns {Object}
   * @private
   */
  getKeysForElement(element) {
    return this.getAttributes(element);
  }
}
