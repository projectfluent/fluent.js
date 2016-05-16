import { L10nError } from './errors';

export function keysFromContext(ctx, keys, method) {
  return keys.map(key => {
    const [id, args] = Array.isArray(key) ?
      key : [key, undefined];

    // XXX Handle errors somehow; emit?
    const [result] = method.call(this, ctx, id, args);
    return result;
  });
}

export function valueFromContext(ctx, id, args) {
  const entity = ctx.messages.get(id);

  if (!entity) {
    return [id, [new L10nError(`Unknown entity: ${id}`)]];
  }

  return ctx.format(entity, args);
}

export function entityFromContext(ctx, id, args) {
  const entity = ctx.messages.get(id);

  if (!entity)  {
    return [
      { value: id, attrs: null },
      [new L10nError(`Unknown entity: ${id}`)]
    ];
  }

  const [value] = ctx.format(entity, args);

  const formatted = {
    value,
    attrs: null,
  };

  if (entity.traits) {
    formatted.attrs = Object.create(null);
    for (let trait of entity.traits) {
      const [attrValue] = ctx.format(trait, args);
      formatted.attrs[trait.key.name] = attrValue;
    }
  }

  return [formatted, []];
}
