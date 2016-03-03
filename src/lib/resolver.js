import { L10nError } from './errors';

const KNOWN_MACROS = ['PLURAL'];
const MAX_PLACEABLE_LENGTH = 2500;

// Unicode bidi isolation characters
const FSI = '\u2068';
const PDI = '\u2069';

export function format(ctx, lang, args, entity) {
  const res = {
    ctx,
    lang,
    args,
    errors: [],
    dirty: new WeakSet()
  };

  return formatValue(res, entity.value);
}

function formatValue(res, value) {
  if (value === null) {
    return [[], null];
  }

  return value.elements.reduce(([errs, seq], elem) => {
    if (typeof elem === 'string') {
      return [errs, seq + elem];
    } else if (elem.type === 'Placeable') {
      try {
        const placeable = resolvePlaceable(res, elem);
        if (placeable.length >= MAX_PLACEABLE_LENGTH) {
          throw new L10nError(
            'Too many characters in placeable (' + placeable.length +
            ', max allowed is ' + MAX_PLACEABLE_LENGTH + ')'
          );
        }
        return [errs, seq + formatPlaceable(res, placeable)];
      } catch(e) {
        return [[...errs, e], seq + formatPlaceable(res, '{}')];
      }
    } else {
      return [
        [...errs, new L10nError('Unresolvable value')],
        seq + formatPlaceable(res, '{}')
      ];
    }
  }, [[], '']);
}

function formatPlaceable(res, value) {
  if (typeof value === 'string') {
    return FSI + value + PDI;
  }

  if (typeof value === 'number' && !isNaN(value)) {
    const formatter = res.ctx._getNumberFormatter(res.lang);
    return formatter.format(value);
  }

  if (typeof value === 'function') {
    return FSI + '{function}' + PDI;
  }
}

function resolveLiteral(res, expr) {
  return expr.value;
}

function resolveBuiltin(res, expr) {
  const id = expr.name;
  if (KNOWN_MACROS.indexOf(id) > -1) {
    return res.ctx._getMacro(res.lang, id);
  }

  throw new L10nError('Unknown reference: ' + id);
}

function resolveVariable(res, expr) {
  const id = expr.id.name;
  const args = res.args;

  if (args && args.hasOwnProperty(id)) {
    return args[id];
  }

  throw new L10nError('Unknown reference: ' + id);
}

function resolveEntity(res, expr) {
  const id = expr.name;
  const entity = res.ctx._getEntity(res.lang, id);

  if (!entity) {
    throw new L10nError('Unknown reference: ' + id);
  }

  if (res.dirty.has(entity)) {
    throw new L10nError('Cyclic reference: ' + id);
  }

  const ret = entity.value !== null ?
    entity.value :
    chooseTrait(entity);

  return resolveValue(res, ret);
}

function resolveCall(res, expr) {
  const callee = resolveBuiltin(res, expr.callee);
  return callee.apply(
    null,
    expr.args.map(
      argExpr => resolveExpression(res, argExpr)
    )
  );
}

function resolveTrait(res, expr) {
  const id = expr.idref.name;
  const key = expr.keyword;
  const entity = res.ctx._getEntity(res.lang, id);

  if (!entity) {
    throw new L10nError('Unknown entity: ' + id);
  }

  const trait = chooseTrait(entity, key);

  if (!trait) {
    throw new L10nError('Unknown trait: ' + property);
  }

  return resolveValue(res, trait.value);
}

function chooseTrait(entity, name) {
  for (let trait of entity.traits) {
    if (name && name === trait.key || trait.default) {
      return trait;
    }
  }
}

function chooseVariant(placeable, expr) {
  if (typeof expr === 'function') {
    for (let variant of placeable.variants) {
      if (expr(variant.key)) {
        return variant;
      }
    }
  } else {
    for (let variant of placeable.variants) {
      if (expr === variant.key) {
        return variant;
      }
    }
  }

  for (let variant of placeable.key) {
    if (variant.default) {
      return variant;
    }
  }

  throw new L10nError('No default variant found');
}

function resolvePlaceable(res, placeable) {
  const expr = resolveExpression(res, placeable.expression);

  if (!placeable.variants) {
    return expr;
  }

  const variant = chooseVariant(placeable, expr);

  return resolveValue(res, variant.value);
}

function resolveExpression(res, expr) {
  // XXX switch?
  if (expr.type === 'Identifier') {
    return resolveEntity(res, expr);
  } else if (expr.type === 'Variable') {
    return resolveVariable(res, expr);
  } else if (expr.type === 'Number') {
    return resolveLiteral(res, expr);
  } else if (expr.type === 'CallExpression') {
    return resolveCall(res, expr);
  } else if (expr.type === 'MemberExpression') {
    return resolveTrait(res, expr);
  } else {
    throw new L10nError('Unknown placeable type');
  }
}

function resolveValue(res, value) {
  const [errs, str] = formatValue(res, value);

  if (errs.length) {
    throw new L10nError('Broken value.');
  }

  return str;
}
