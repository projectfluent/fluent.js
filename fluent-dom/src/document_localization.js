/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* global console */

import overlayElement from './overlay';

class L10nError extends Error {
  constructor(message, id, lang) {
    super();
    this.name = 'L10nError';
    this.message = message;
    this.id = id;
    this.lang = lang;
  }
}

/**
 * The `Localization` class is responsible for fetching resources and
 * formatting translations.
 *
 * It implements the fallback strategy in case of errors encountered during the
 * formatting of translations and methods for observing DOM
 * trees with a `MutationObserver`.
 */
export default class DocumentLocalization {
  /**
   * @returns {DocumentLocalization}
   */
  constructor(doc, resIds, generateMessages) {
    this.id = doc.location.href;
    this.resIds = resIds;
    this.generageMessages = generateMessages;
    this.ctxs = this.generateMessages(this.id, this.resIds);
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

  /**
   * Format translations and handle fallback if needed.
   *
   * Format translations for `keys` from `MessageContext` instances on this
   * DocumentLocalization. In case of errors, fetch the next context in the
   * fallback chain, and recursively call `formatWithFallback` again.
   *
   * @param   {Array<Array>}          keys    - Translation keys to format.
   * @param   {Function}              method  - Formatting function.
   * @returns {Promise<Array<string>>}
   * @private
   */
  async formatWithFallback(keys, method) {
    const translations = [];
    for (const o of this.ctxs) {
      const ctx = await o.ready();
      const errors = keysFromContext(method, ctx, keys, translations);
      if (!errors) {
        break;
      }
    }
    return translations;
  }

  /**
   * Format translations into {value, attrs} objects.
   *
   * The fallback logic is the same as in `formatValues` but the argument type
   * is stricter (an array of arrays) and it returns {value, attrs} objects
   * which are suitable for the translation of DOM elements.
   *
   *     docL10n.formatMessages([j
   *       ['hello', { who: 'Mary' }],
   *       ['welcome', undefined]
   *     ]).then(console.log);
   *
   *     // [
   *     //   { value: 'Hello, Mary!', attrs: null },
   *     //   { value: 'Welcome!', attrs: { title: 'Hello' } }
   *     // ]
   *
   * Returns a Promise resolving to an array of the translation strings.
   *
   * @param   {Array<Array>} keys
   * @returns {Promise<Array<{value: string, attrs: Object}>>}
   * @private
   */
  formatMessages(keys) {
    return this.formatWithFallback(keys, messageFromContext);
  }

  /**
   * Retrieve translations corresponding to the passed keys.
   *
   * A generalized version of `DocumentLocalization.formatValue`. Keys can
   * either be simple string identifiers or `[id, args]` arrays.
   *
   *     docL10n.formatValues(
   *       ['hello', { who: 'Mary' }],
   *       ['hello', { who: 'John' }],
   *       'welcome'
   *     ).then(console.log);
   *
   *     // ['Hello, Mary!', 'Hello, John!', 'Welcome!']
   *
   * Returns a Promise resolving to an array of the translation strings.
   *
   * @param   {...(Array | string)} keys
   * @returns {Promise<Array<string>>}
   */
  formatValues(keys) {
    return this.formatWithFallback(keys, valueFromContext);
  }

  /**
   * Retrieve the translation corresponding to the `id` identifier.
   *
   * If passed, `args` is a simple hash object with a list of variables that
   * will be interpolated in the value of the translation.
   *
   *     docL10n.formatValue(
   *       'hello', { who: 'world' }
   *     ).then(console.log);
   *
   *     // 'Hello, world!'
   *
   * Returns a Promise resolving to the translation string.
   *
   * Use this sparingly for one-off messages which don't need to be
   * retranslated when the user changes their language preferences, e.g. in
   * notifications.
   *
   * @param   {string}  id     - Identifier of the translation to format
   * @param   {Object}  [args] - Optional external arguments
   * @returns {Promise<string>}
   */
  async formatValue(id, args) {
    const [val] = await this.formatValues([[id, args]]);
    return val;
  }

  handleEvent() {
    this.onLanguageChange();
  }

  onLanguageChange() {
    this.ctxs = this.generateContexts(this.id, this.resIds);
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

/**
 * Format the value of a message into a string.
 *
 * This function is passed as a method to `keysFromContext` and resolve
 * a value of a single L10n Entity using provided `MessageContext`.
 *
 * If the function fails to retrieve the entity, it will return an ID of it.
 * If formatting fails, it will return a partially resolved entity.
 *
 * In both cases, an error is being added to the errors array.
 *
 * @param   {MessageContext} ctx
 * @param   {Array<Error>}   errors
 * @param   {string}         id
 * @param   {Object}         args
 * @returns {string}
 * @private
 */
function valueFromContext(ctx, errors, id, args) {
  const entity = ctx.messages.get(id);

  if (entity === undefined) {
    errors.push(new L10nError(`Unknown entity: ${id}`));
    return id;
  }

  return ctx.format(entity, args, errors);
}

/**
 * Format all public values of a message into a { value, attrs } object.
 *
 * This function is passed as a method to `keysFromContext` and resolve
 * a single L10n Entity using provided `MessageContext`.
 *
 * The function will return an object with a value and attributes of the
 * entity.
 *
 * If the function fails to retrieve the entity, the value is set to the ID of
 * an entity, and attrs to `null`. If formatting fails, it will return
 * a partially resolved value and attributes.
 *
 * In both cases, an error is being added to the errors array.
 *
 * @param   {MessageContext} ctx
 * @param   {Array<Error>}   errors
 * @param   {String}         id
 * @param   {Object}         args
 * @returns {Object}
 * @private
 */
function messageFromContext(ctx, errors, id, args) {
  const msg = ctx.messages.get(id);

  if (msg === undefined) {
    errors.push(new L10nError(`Unknown message: ${id}`));
    return { value: id, attrs: null };
  }

  const formatted = {
    value: ctx.format(msg, args, errors),
    attrs: null,
  };

  if (msg.attrs) {
    formatted.attrs = [];
    for (const attrName in msg.attrs) {
      const formattedAttr = ctx.format(msg.attrs[attrName], args, errors);
      if (formattedAttr !== null) {
        formatted.attrs.push([
          attrName,
          formattedAttr
        ]);
      }
    }
  }

  return formatted;
}

/**
 * @private
 *
 * This function is an inner function for
 * `DocumentLocalization.formatWithFallback`.
 *
 * It takes a `MessageContext`, list of l10n-ids and a method to be used for
 * key resolution (either `valueFromContext` or `entityFromContext`) and
 * optionally a value returned from `keysFromContext` executed against
 * another `MessageContext`.
 *
 * The idea here is that if the previous `MessageContext` did not resolve
 * all keys, we're calling this function with the next context to resolve
 * the remaining ones.
 *
 * In the function, we loop oer `keys` and check if we have the `prev`
 * passed and if it has an error entry for the position we're in.
 *
 * If it doesn't, it means that we have a good translation for this key and
 * we return it. If it does, we'll try to resolve the key using the passed
 * `MessageContext`.
 *
 * In the end, we return an Object with resolved translations, errors and
 * a boolean indicating if there were any errors found.
 *
 * The translations are either strings, if the method is `valueFromContext`
 * or objects with value and attributes if the method is `entityFromContext`.
 *
 * See `Localization.formatWithFallback` for more info on how this is used.
 *
 * @param {MessageContext} ctx
 * @param {Array<string>}  keys
 * @param {Function}       method
 * @param {{
 *   errors: Array<Error>,
 *   withoutFatal: Array<boolean>,
 *   hasFatalErrors: boolean,
 *   translations: Array<string>|Array<{value: string, attrs: Object}>}} prev
 *
 * @returns {{
 *   errors: Array<Error>,
 *   withoutFatal: Array<boolean>,
 *   hasFatalErrors: boolean,
 *   translations: Array<string>|Array<{value: string, attrs: Object}>}}
 */
function keysFromContext(method, ctx, keys, translations) {
  const messageErrors = [];
  let hasErrors = false;

  keys.forEach((key, i) => {
    if (translations[i] !== undefined) {
      return;
    }

    messageErrors.length = 0;
    const translation = method(ctx, messageErrors, key[0], key[1]);

    if (messageErrors.length === 0) {
      translations[i] = translation;
    } else {
      hasErrors = true;
      if (typeof console !== 'undefined') {
        messageErrors.forEach(error => console.warn(error));
      }
    }
  });

  return hasErrors;
}
