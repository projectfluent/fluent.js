import { L10nError } from './errors';

export function keysFromContext(ctx, keys, method, prev) {
  const errors = [];
  const translations = keys.map((key, i) => {
    if (prev && prev[i] && prev[i][1].length === 0) {
      // Use a previously formatted good value if there were no errors
      return prev[i];
    }

    const result = method(ctx, key[0], key[1]);
    errors.push(...result[1]);
    // XXX Depending on the kind of errors it might be better to return prev[i]
    // here;  for instance, when the current translation is completely missing
    return result;
  });

  return [translations, errors];
}

export function valueFromContext(ctx, id, args) {
  const entity = ctx.messages.get(id);

  if (entity === undefined) {
    return [id, [new L10nError(`Unknown entity: ${id}`)]];
  }

  return ctx.format(entity, args);
}

export function entityFromContext(ctx, id, args) {
  const entity = ctx.messages.get(id);

  if (entity === undefined) {
    return [
      { value: id, attrs: null },
      [new L10nError(`Unknown entity: ${id}`)]
    ];
  }

  const formattedValue = ctx.formatToPrimitive(entity, args);
  const errors = formattedValue[1];

  const formatted = {
    value: formattedValue[0],
    attrs: null,
  };

  if (entity.traits) {
    formatted.attrs = Object.create(null);
    for (let trait of entity.traits) {
      const formattedTrait = ctx.format(trait.val, args);
      errors.push(...formattedTrait[1]);
      formatted.attrs[trait.key.name] = formattedTrait[0];
    }
  }

  return [formatted, errors];
}
