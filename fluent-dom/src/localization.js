/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* global console */

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
 */
export default class Localization {
  /**
   * @returns {Localization}
   */
  constructor(resIds, generateMessages) {
    this.resIds = resIds;
    this.generateMessages = generateMessages;
    this.ctxs = this.generateMessages(this.resIds);
  }

  /**
   * Format translations and handle fallback if needed.
   *
   * Format translations for `keys` from `MessageContext` instances on this
   * DOMLocalization. In case of errors, fetch the next context in the
   * fallback chain.
   *
   * @param   {Array<Array>}          keys    - Translation keys to format.
   * @param   {Function}              method  - Formatting function.
   * @returns {Promise<Array<string|Object>>}
   * @private
   */
  async formatWithFallback(keys, method) {
    const translations = [];
    for (let ctx of this.ctxs) {
      if (typeof ctx.then === 'function') {
        // XXX: Remove once jsdoc supports `await ctx`
        ctx = await ctx.then();
      }
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
   *     docL10n.formatMessages([
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
   * A generalized version of `DOMLocalization.formatValue`. Keys can
   * either be simple string identifiers or `[id, args]` arrays.
   *
   *     docL10n.formatValues([
   *       ['hello', { who: 'Mary' }],
   *       ['hello', { who: 'John' }]
   *     ]).then(console.log);
   *
   *     // ['Hello, Mary!', 'Hello, John!', 'Welcome!']
   *
   * Returns a Promise resolving to an array of the translation strings.
   *
   * @param   {Array<Array>} keys
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
    this.ctxs = this.generateMessages(this.resIds);
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
  const msg = ctx.getMessage(id);

  if (msg === undefined) {
    errors.push(new L10nError(`Unknown entity: ${id}`));
    return id;
  }

  return ctx.format(msg, args, errors);
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
  const msg = ctx.getMessage(id);

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
 * This function is an inner function for `Localization.formatWithFallback`.
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
 * In the end, we fill the translations array, and return if we
 * encountered at least one error.
 *
 * See `Localization.formatWithFallback` for more info on how this is used.
 *
 * @param {Function}       method
 * @param {MessageContext} ctx
 * @param {Array<string>}  keys
 * @param {{Array<{value: string, attrs: Object}>}} translations
 *
 * @returns {Boolean}
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

    if (messageErrors.length === 0 ||
        !messageErrors.some(e => e instanceof L10nError)) {
      translations[i] = translation;
    } else {
      hasErrors = true;
    }

    if (messageErrors.length && typeof console !== 'undefined') {
      messageErrors.forEach(error => console.warn(error));
    }
  });

  return hasErrors;
}
