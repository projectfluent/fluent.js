import { L10nError } from './errors';

export function keysFromContext(ctx, keys, method, prev) {
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

    const translation = method(ctx, entityErrors, key[0], key[1]);
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

export function valueFromContext(ctx, errors, id, args) {
  const entity = ctx.messages.get(id);

  if (entity === undefined) {
    errors.push(new L10nError(`Unknown entity: ${id}`));
    return id;
  }

  return ctx.format(entity, args, errors);
}

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
      const attr = ctx.format(trait.val, args, errors);
      if (attr !== null) {
        formatted.attrs[trait.key.name] = attr;
      }
    }
  }

  return formatted;
}
