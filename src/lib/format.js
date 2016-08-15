import { L10nError } from './errors';

export function keysFromContext(ctx, keys, method, prev) {
  const errors = [];
  const translations = keys.map((key, i) => {
    if (prev && prev[i] && prev[i][1].length === 0) {
      // Use a previously formatted good value if there were no errors
      return prev[i];
    }

    const [id, args] = Array.isArray(key) ?
      key : [key, undefined];

    const result = method(ctx, id, args);
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

  const [value, errors] = ctx.formatToPrimitive(entity, args);

  const formatted = {
    value,
    attrs: null,
  };

  if (entity.traits) {
    formatted.attrs = Object.create(null);
    for (let trait of entity.traits) {
      const [attrValue, attrErrors] = ctx.format(trait, args);
      errors.push(...attrErrors);
      formatted.attrs[trait.key.name] = attrValue;
    }
  }

  return [formatted, errors];
}
