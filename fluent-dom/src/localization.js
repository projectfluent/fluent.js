/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* global console */

import { CachedAsyncIterable } from "cached-iterable";

/**
 * The `Localization` class is a central high-level API for vanilla
 * JavaScript use of Fluent.
 * It combines language negotiation, FluentBundle and I/O to
 * provide a scriptable API to format translations.
 */
export default class Localization {
  /**
   * @param {Array<String>} resourceIds     - List of resource IDs
   * @param {Function}      generateBundles - Function that returns a
   *                                          generator over FluentBundles
   *
   * @returns {Localization}
   */
  constructor(resourceIds = [], generateBundles) {
    this.resourceIds = resourceIds;
    this.generateBundles = generateBundles;
    this.bundles = CachedAsyncIterable.from(
      this.generateBundles(this.resourceIds));
  }

  addResourceIds(resourceIds) {
    this.resourceIds.push(...resourceIds);
    this.onChange();
    return this.resourceIds.length;
  }

  removeResourceIds(resourceIds) {
    this.resourceIds = this.resourceIds.filter(r => !resourceIds.includes(r));
    this.onChange();
    return this.resourceIds.length;
  }

  /**
   * Format translations and handle fallback if needed.
   *
   * Format translations for `keys` from `FluentBundle` instances on this
   * DOMLocalization. In case of errors, fetch the next context in the
   * fallback chain.
   *
   * @param   {Array<Object>}         keys    - Translation keys to format.
   * @param   {Function}              method  - Formatting function.
   * @returns {Promise<Array<string|Object>>}
   * @private
   */
  async formatWithFallback(keys, method) {
    const translations = [];

    for await (const bundle of this.bundles) {
      const missingIds = keysFromBundle(method, bundle, keys, translations);

      if (missingIds.size === 0) {
        break;
      }

      if (typeof console !== "undefined") {
        const locale = bundle.locales[0];
        const ids = Array.from(missingIds).join(", ");
        console.warn(`Missing translations in ${locale}: ${ids}`);
      }
    }

    return translations;
  }

  /**
   * Format translations into {value, attributes} objects.
   *
   * The fallback logic is the same as in `formatValues` but it returns {value,
   * attributes} objects which are suitable for the translation of DOM
   * elements.
   *
   *     docL10n.formatMessages([
   *       {id: 'hello', args: { who: 'Mary' }},
   *       {id: 'welcome'}
   *     ]).then(console.log);
   *
   *     // [
   *     //   { value: 'Hello, Mary!', attributes: null },
   *     //   {
   *     //     value: 'Welcome!',
   *     //     attributes: [ { name: "title", value: 'Hello' } ]
   *     //   }
   *     // ]
   *
   * Returns a Promise resolving to an array of the translation strings.
   *
   * @param   {Array<Object>} keys
   * @returns {Promise<Array<{value: string, attributes: Object}>>}
   * @private
   */
  formatMessages(keys) {
    return this.formatWithFallback(keys, messageFromBundle);
  }

  /**
   * Retrieve translations corresponding to the passed keys.
   *
   * A generalized version of `DOMLocalization.formatValue`. Keys must
   * be `{id, args}` objects.
   *
   *     docL10n.formatValues([
   *       {id: 'hello', args: { who: 'Mary' }},
   *       {id: 'hello', args: { who: 'John' }},
   *       {id: 'welcome'}
   *     ]).then(console.log);
   *
   *     // ['Hello, Mary!', 'Hello, John!', 'Welcome!']
   *
   * Returns a Promise resolving to an array of the translation strings.
   *
   * @param   {Array<Object>} keys
   * @returns {Promise<Array<string>>}
   */
  formatValues(keys) {
    return this.formatWithFallback(keys, valueFromBundle);
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
    const [val] = await this.formatValues([{id, args}]);
    return val;
  }

  handleEvent() {
    this.onChange();
  }

  /**
   * This method should be called when there's a reason to believe
   * that language negotiation or available resources changed.
   */
  onChange() {
    this.bundles = CachedAsyncIterable.from(
      this.generateBundles(this.resourceIds));
    this.bundles.touchNext(2);
  }
}

/**
 * Format the value of a message into a string or `null`.
 *
 * This function is passed as a method to `keysFromBundle` and resolve
 * a value of a single L10n Entity using provided `FluentBundle`.
 *
 * If the message doesn't have a value, return `null`.
 *
 * @param   {FluentBundle} bundle
 * @param   {Array<Error>} errors
 * @param   {Object} message
 * @param   {Object} args
 * @returns {string}
 * @private
 */
function valueFromBundle(bundle, errors, message, args) {
  if (message.value) {
    return bundle.formatPattern(message.value, args, errors);
  }

  return null;
}

/**
 * Format all public values of a message into a {value, attributes} object.
 *
 * This function is passed as a method to `keysFromBundle` and resolve
 * a single L10n Entity using provided `FluentBundle`.
 *
 * The function will return an object with a value and attributes of the
 * entity.
 *
 * @param   {FluentBundle} bundle
 * @param   {Array<Error>} errors
 * @param   {Object} message
 * @param   {Object} args
 * @returns {Object}
 * @private
 */
function messageFromBundle(bundle, errors, message, args) {
  const formatted = {
    value: null,
    attributes: null,
  };

  if (message.value) {
    formatted.value = bundle.formatPattern(message.value, args, errors);
  }

  if (message.attributes) {
    formatted.attributes = [];
    for (const [name, attr] of Object.entries(message.attributes)) {
      const value = bundle.formatPattern(attr, args, errors);
      formatted.attributes.push({name, value});
    }
  }

  return formatted;
}

/**
 * This function is an inner function for `Localization.formatWithFallback`.
 *
 * It takes a `FluentBundle`, list of l10n-ids and a method to be used for
 * key resolution (either `valueFromBundle` or `messageFromBundle`) and
 * optionally a value returned from `keysFromBundle` executed against
 * another `FluentBundle`.
 *
 * The idea here is that if the previous `FluentBundle` did not resolve
 * all keys, we're calling this function with the next context to resolve
 * the remaining ones.
 *
 * In the function, we loop over `keys` and check if we have the `prev`
 * passed and if it has an error entry for the position we're in.
 *
 * If it doesn't, it means that we have a good translation for this key and
 * we return it. If it does, we'll try to resolve the key using the passed
 * `FluentBundle`.
 *
 * In the end, we fill the translations array, and return the Set with
 * missing ids.
 *
 * See `Localization.formatWithFallback` for more info on how this is used.
 *
 * @param {Function}       method
 * @param {FluentBundle} bundle
 * @param {Array<string>}  keys
 * @param {{Array<{value: string, attributes: Object}>}} translations
 *
 * @returns {Set<string>}
 * @private
 */
function keysFromBundle(method, bundle, keys, translations) {
  const messageErrors = [];
  const missingIds = new Set();

  keys.forEach(({id, args}, i) => {
    if (translations[i] !== undefined) {
      return;
    }

    let message = bundle.getMessage(id);
    if (message) {
      messageErrors.length = 0;
      translations[i] = method(bundle, messageErrors, message, args);
      // XXX: Report resolver errors
    } else {
      missingIds.add(id);
    }
  });

  return missingIds;
}
