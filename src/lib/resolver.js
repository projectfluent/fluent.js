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

  return formatValue(res, entity);
}

function formatValue(res, elements) {
  return elements.reduce(([errs, seq], elem) => {
    if (elem.type === 'textElement') {
      return [errs, seq + elem.value];
    } else if (elem.type === 'placeableElement') {
      try {
        const placeable = resolvePlaceable(res, elem);
        if (placeable.length >= MAX_PLACEABLE_LENGTH) {
          throw new L10nError(
            'Too many characters in placeable (' + placeable.length +
            ', max allowed is ' + MAX_PLACEABLE_LENGTH + ')'
          );
        }
        return [errs, seq + FSI + placeable + PDI];
      } catch(e) {
        return [[...errs, e], seq + FSI + '{ }' + PDI];
      }
    } else {
      return [
        [...errs, new L10nError('Unresolvable value')],
        seq + FSI + '{ }' + PDI
      ];
    }
  }, [[], '']);
}

function resolveLiteral(res, expr) {
  return expr.value;
}

function resolveBuiltin(res, expr) {
  if (KNOWN_MACROS.indexOf(expr) > -1) {
    return res.ctx._getMacro(lang, expr);
  }

  throw new L10nError('Unknown reference: ' + expr);
}

function resolveArgument(res, expr) {
  const id = expr.id;
  const args = res.args;

  if (args && args.hasOwnProperty(id)) {
    if (typeof args[id] === 'string') {
      // wrap the substitution in bidi isolate characters
      return FSI + args[id] + PDI;
    }
    if (typeof args[id] === 'number' && !isNaN(args[id])) {
      const formatter = res.ctx._getNumberFormatter(lang);
      return formatter.format(args[id]);
    } else {
      throw new L10nError('Arg must be a string or a number: ' + id);
    }
  }

  throw new L10nError('Unknown reference: ' + id);
}

function resolveEntity(res, expr) {
  const id = expr.id;
  const entity = res.ctx._getEntity(res.lang, id);

  if (!entity) {
    throw new L10nError('Unknown reference: ' + id);
  }

  if (res.dirty.has(entity)) {
    throw new L10nError('Cyclic reference: ' + id);
  }

  const [errs, value] = formatValue(res, entity);

  if (errs.length) {
    throw new L10nError('Reference to a broken entity: ' + id);
  }

  return value;
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
  const object = expr.object;
  const property = expr.property;
  const entity = res.ctx._getEntity(res.lang, object);

  if (entity && entity.traits.hasOwnProperty(property)) {
    return formatValue(res, entity.traits[property]);
  }

  throw new L10nError('Unknown trait: ' + property);
}

function chooseVariant(placeable, expr) {
  if (typeof expr === 'function') {
    for (let variant of placeable.variants) {
      if (expr(variant.selector)) {
        return variant;
      }
    }
  } else {
    for (let variant of placeable.variants) {
      if (expr === variant.selector) {
        return variant;
      }
    }
  }

  for (let variant of placeable.variants) {
    if (variant.default) {
      return variant;
    }
  }

  throw new L10nError('No default variant found');
}

function resolvePlaceable(res, placeable) {
  const expr = resolveExpression(res, placeable.expr);

  if (!placeable.variants) {
    return expr;
  }

  const variant = chooseVariant(placeable, expr);

  const [errs, value] = formatValue(res, variant.value);

  if (errs.length) {
    throw new L10nError('Broken variant.');
  }

  return value;
}

function resolveExpression(res, args, expr) {
  // XXX switch?
  if (expr.type === 'callExpression') {
    return resolveCall(res, expr);
  } else if (expr.type === 'traitExpression') {
    return resolveTrait(res, expr);
  } else if (expr.type === 'argumentExpression') {
    return resolveArgument(res, expr);
  } else if (expr.type === 'messageExpression') {
    return resolveEntity(res, expr);
  } else if (expr.type === 'literalExpression') {
    return resolveLiteral(res, expr);
  } else {
    throw new L10nError('Unknown placeable type');
  }
}
