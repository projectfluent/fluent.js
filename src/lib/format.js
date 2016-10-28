import { L10nError } from './errors';

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
 *   hasErrors: boolean,
 *   translations: Array<string>|Array<{value: string, attrs: Object}>}} prev
 *
 * @returns {{
 *   errors: Array<Error>,
 *   hasErrors: boolean,
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
 */
export function valueFromContext(ctx, errors, id, args) {
  const entity = ctx.messages.get(id);

  if (entity === undefined) {
    errors.push(new L10nError(`Unknown entity: ${id}`));
    return id;
  }

  return ctx.format(entity, args, errors);
}

/**
 * @private
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
 */
export function entityFromContext(ctx, errors, id, args) {
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
