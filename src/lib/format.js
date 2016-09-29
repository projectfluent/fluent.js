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
  const current = {
    errors: new Array(keys.length),
    hasErrors: false
  };

  current.translations = keys.map((key, i) => {
    if (prev && !prev.errors[i]) {
      // Use a previously formatted good value if there were no errors
      return prev.translations[i];
    }

    const args = sanitizeArgs(key[1]);
    const translation = method(ctx, entityErrors, key[0], args);
    if (entityErrors.length) {
      current.errors[i] = entityErrors.slice();
      entityErrors.length = 0;
      if (!current.hasErrors) {
        current.hasErrors = true;
      }
    }

    return translation;
  });

  return current;
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
    formatted.attrs = Object.create(null);
    for (let i = 0, trait; (trait = entity.traits[i]); i++) {
      const attr = ctx.format(trait, args, errors);
      if (attr !== null) {
        formatted.attrs[trait.key.name] = attr;
      }
    }
  }

  return formatted;
}
