import { L10nError } from './errors';

export const properties = new WeakMap();
export const contexts = new WeakMap();

/**
 * The `Localization` class is responsible for fetching resources and
 * formatting translations.
 *
 * It implements the fallback strategy in case of errors encountered during the
 * formatting of translations.
 *
 * In HTML and XUL, l20n.js will create an instance of `Localization` for the
 * default set of `<link rel="localization">` elements.  You can get
 * a reference to it via:
 *
 *     const localization = document.l10n.get('main');
 *
 * Different names can be specified via the `name` attribute on the `<link>`
 * elements.  One `document` can have more than one `Localization` instance,
 * but one `Localization` instance can only be assigned to a single `document`.
 */
export default class Localization {

  /**
   * Create an instance of the `Localization` class.
   *
   * The instance's configuration is provided by two runtime-dependent
   * functions passed to the constructor.
   *
   * The `requestBundles` function takes an array of language codes and returns
   * a Promise of an array of lazy `ResourceBundle` instances.  The
   * `Localization` instance will imediately call the `fetch` method of the
   * first bundle returned by `requestBundles` and may call `fetch` on
   * subsequent bundles in fallback scenarios.
   *
   * The array of bundles is the de-facto current fallback chain of languages
   * and fetch locations.
   *
   * The `createContext` function takes a language code and returns an instance
   * of `Intl.MessageContext`.  Since it's also provided to the constructor by
   * the runtime it may pass runtime-specific `functions` to the
   * `MessageContext` instances it creates.
   *
   * @param   {Function}     requestBundles
   * @param   {Function}     createContext
   * @returns {Localization}
   */
  constructor(requestBundles, createContext) {
    const createHeadContext =
      bundles => createHeadContextWith(createContext, bundles);

    // Keep `requestBundles` and `createHeadContext` private.
    properties.set(this, {
      requestBundles, createHeadContext
    });

    /**
     * A Promise which resolves when the `Localization` instance has fetched
     * and parsed all localization resources in the user's first preferred
     * language (if available).
     *
     *     localization.interactive.then(callback);
     */
    this.interactive = requestBundles().then(
      // Create a `MessageContext` for the first bundle right away.
      bundles => createHeadContext(bundles).then(
        // Force `this.interactive` to resolve to the list of bundles.
        () => bundles
      )
    );
  }

  /**
   * Initiate the change of the currently negotiated languages.
   *
   * `requestLanguages` takes an array of language codes representing user's
   * updated language preferences.
   *
   * @param   {Array<string>}     requestedLangs
   * @returns {Promise<Array<ResourceBundle>>}
   */
  requestLanguages(requestedLangs) {
    const { requestBundles, createHeadContext } = properties.get(this);

    // Assign to `this.interactive` to make all translations requested after
    // the language change request come from the new fallback chain.
    return this.interactive = Promise.all(
      // Get the current bundles to be able to compare them to the new result
      // of the language negotiation.
      [this.interactive, requestBundles(requestedLangs)]
    ).then(([oldBundles, newBundles]) => {
      if (equal(oldBundles, newBundles)) {
        return oldBundles;
      }

      return createHeadContext(newBundles).then(
        () => newBundles
      );
    });
  }

  /**
   * Format translations and handle fallback if needed.
   *
   * Format translations for `keys` from `MessageContext` instances
   * corresponding to the current bundles.  In case of errors, fetch the next
   * bundle in the fallback chain, create a context for it, and recursively
   * call `formatWithFallback` again.
   *
   * @param   {Array<ResourceBundle>} bundles - Current bundles.
   * @param   {Array<Array>}          keys    - Translation keys to format.
   * @param   {Function}              method  - Formatting function.
   * @param   {Array<string>}         [prev]  - Previous translations.
   * @returns {Array<string> | Promise<Array<string>>}
   * @private
   */
  formatWithFallback(bundles, ctx, keys, method, prev) {
    // If a context for the head bundle doesn't exist we've reached the last
    // bundle in the fallback chain.  This is the end condition which returns
    // the translations formatted during the previous (recursive) calls to
    // `formatWithFallback`.
    if (!ctx) {
      return prev.translations;
    }

    const current = keysFromContext(
      method, this.sanitizeArgs, ctx, keys, prev
    );

    // In Gecko `console` needs to imported explicitly.
    if (typeof console !== 'undefined') {
      // The `errors` property is an array of arrays, each containing all
      // errors encountered for the translation at the same position in `keys`.
      // If there were no errors for a given translation, `errors` will contain
      // an `undefined` instead of the array of errors.  Most translations are
      // simple string which don't produce errors.
      current.errors.forEach(
        errs => errs ? errs.forEach(
          e => console.warn(e) // eslint-disable-line no-console
        ) : null
      );
    }

    // `hasFatalErrors` is a flag set by `keysFromContext` to notify about
    // errors during the formatting.  We can't just check the `length` of the
    // `errors` property because it is fixed and equal to the length of `keys`.
    if (!current.hasFatalErrors) {
      return current.translations;
    }

    // At this point we need to fetch the next bundle in the fallback chain and
    // create a `MessageContext` instance for it.
    const tailBundles = bundles.slice(1);
    const { createHeadContext } = properties.get(this);

    return createHeadContext(tailBundles).then(
      next => this.formatWithFallback(
        tailBundles, next, keys, method, current
      )
    );
  }

  /**
   * Format translations into {value, attrs} objects.
   *
   * This is an internal method used by `LocalizationObserver` instances.  The
   * fallback logic is the same as in `formatValues` but the argument type is
   * stricter (an array of arrays) and it returns {value, attrs} objects which
   * are suitable for the translation of DOM elements.
   *
   *     document.l10n.formatEntities([j
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
  formatEntities(keys) {
    return this.interactive.then(
      bundles => this.formatWithFallback(
        bundles, contexts.get(bundles[0]), keys, this.entityFromContext
      )
    );
  }

  /**
   * Retrieve translations corresponding to the passed keys.
   *
   * A generalized version of `Localization.formatValue`.  Keys can either be
   * simple string identifiers or `[id, args]` arrays.
   *
   *     document.l10n.formatValues(
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
  formatValues(...keys) {
    // Convert string keys into arrays that `formatWithFallback` expects.
    const keyTuples = keys.map(
      key => Array.isArray(key) ? key : [key, null]
    );
    return this.interactive.then(
      bundles => this.formatWithFallback(
        bundles, contexts.get(bundles[0]), keyTuples, this.valueFromContext
      )
    );
  }

  /**
   * Retrieve the translation corresponding to the `id` identifier.
   *
   * If passed, `args` is a simple hash object with a list of variables that
   * will be interpolated in the value of the translation.
   *
   *     localization.formatValue(
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
  formatValue(id, args) {
    return this.formatValues([id, args]).then(
      ([val]) => val
    );
  }

  /**
   * Sanitize external arguments.
   *
   * Subclasses of `Localization` can override this method to provide
   * environment-specific sanitization of arguments passed into translations.
   *
   * @param   {Object} args
   * @returns {Object}
   * @private
   */
  sanitizeArgs(args) {
    return args;
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
   * Subclasses of `Localization` can override this method to provide
   * environment-specific formatting behavior.
   *
   * @param   {MessageContext} ctx
   * @param   {Array<Error>}   errors
   * @param   {String}         id
   * @param   {Object}         args
   * @returns {Object}
   * @private
   */
  entityFromContext(ctx, errors, id, args) {
    const entity = ctx.messages.get(id);

    if (entity === undefined) {
      errors.push(new L10nError(`Unknown entity: ${id}`));
      return { value: id, attrs: null };
    }

    const formatted = {
      value: ctx.format(entity, args, errors),
      attrs: null,
    };

    if (entity.traits) {
      formatted.attrs = [];
      for (let i = 0, trait; (trait = entity.traits[i]); i++) {
        if (!trait.key.hasOwnProperty('ns')) {
          continue;
        }
        const attr = ctx.format(trait, args, errors);
        if (attr !== null) {
          formatted.attrs.push([
            trait.key.ns,
            trait.key.name,
            attr
          ]);
        }
      }
    }

    return formatted;
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
   * Subclasses of `Localization` can override this method to provide
   * environment-specific formatting behavior.
   *
   * @param   {MessageContext} ctx
   * @param   {Array<Error>}   errors
   * @param   {string}         id
   * @param   {Object}         args
   * @returns {string}
   * @private
   */
  valueFromContext(ctx, errors, id, args) {
    const entity = ctx.messages.get(id);

    if (entity === undefined) {
      errors.push(new L10nError(`Unknown entity: ${id}`));
      return id;
    }

    return ctx.format(entity, args, errors);
  }
}

/**
 * Create a `MessageContext` for the first bundle in the fallback chain.
 *
 * Fetches the bundle's resources and creates a context from them.
 *
 * @param   {Array<ResourceBundle>} bundle
 * @param   {Function}              createContext
 * @returns {Promise<MessageContext>}
 * @private
 */
function createHeadContextWith(createContext, bundles) {
  const [bundle] = bundles;

  if (!bundle) {
    return Promise.resolve(null);
  }

  return bundle.fetch().then(resources => {
    const ctx = createContext(bundle.lang);
    resources
      // Filter out resources which failed to load correctly (e.g. 404).
      .filter(res => res !== null)
      .forEach(res => ctx.addMessages(res));
    // Save the reference to the context.
    contexts.set(bundle, ctx);
    return ctx;
  });
}

/**
 *
 * Test if two fallback chains are functionally the same.
 *
 * @param   {Array<ResourceBundle>} bundles1
 * @param   {Array<ResourceBundle>} bundles2
 * @returns {boolean}
 * @private
 */
function equal(bundles1, bundles2) {
  return bundles1.length === bundles2.length &&
    bundles1.every(({lang}, i) => lang === bundles2[i].lang);
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
export function keysFromContext(method, sanitizeArgs, ctx, keys, prev) {
  const entityErrors = [];
  const result = {
    errors: new Array(keys.length),
    withoutFatal: new Array(keys.length),
    hasFatalErrors: false,
  };

  result.translations = keys.map((key, i) => {
    // Use a previously formatted good value if it had no errors.
    if (prev && !prev.errors[i] ) {
      return prev.translations[i];
    }

    // Clear last entity's errors.
    entityErrors.length = 0;
    const args = sanitizeArgs(key[1]);
    const translation = method(ctx, entityErrors, key[0], args);

    // No errors still? Use this translation as fallback to the previous one
    // which had errors.
    if (entityErrors.length === 0) {
      return translation;
    }

    // The rest of this function handles the scenario in which the translation
    // was formatted with errors.  Copy the errors to the result object so that
    // the Localization can handle them (e.g. console.warn about them).
    result.errors[i] = entityErrors.slice();

    // Formatting errors are not fatal and the translations are usually still
    // usable and can be good fallback values.  Fatal errors should signal to
    // the Localization that another fallback should be loaded.
    if (!entityErrors.some(isL10nError)) {
      result.withoutFatal[i] = true;
    } else if (!result.hasFatalErrors) {
      result.hasFatalErrors = true;
    }

    // Use the previous translation for this `key` even if it had formatting
    // errors.  This is usually closer the user's preferred language anyways.
    if (prev && prev.withoutFatal[i]) {
      // Mark this previous translation as a good potential fallback value in
      // case of further fallbacks.
      result.withoutFatal[i] = true;
      return prev.translations[i];
    }

    // If no good or almost good previous translation is available, return the
    // current translation.  In case of minor errors it's a partially
    // formatted translation.  In the worst-case scenario it an identifier of
    // the requested entity.
    return translation;
  });

  return result;
}

/**
 * @private
 *
 * Test if an error is an instance of L10nError.
 *
 * @param   {Error}   error
 * @returns {boolean}
 */
function isL10nError(error) {
  return error instanceof L10nError;
}
