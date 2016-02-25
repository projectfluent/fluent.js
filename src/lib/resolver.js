import { L10nError } from './errors';

const KNOWN_MACROS = ['PLURAL'];
const MAX_PLACEABLE_LENGTH = 2500;

// Unicode bidi isolation characters
const FSI = '\u2068';
const PDI = '\u2069';

const resolutionChain = new WeakSet();

export function format(ctx, lang, args, entity) {
  if (resolutionChain.has(entity)) {
    throw new L10nError('Cyclic reference detected');
  }

  resolutionChain.add(entity);

  let rv;
  // if format fails, we want the exception to bubble up and stop the whole
  // resolving process;  however, we still need to remove the entity from the
  // resolution chain
  try {
    rv = resolveValue(
      {}, ctx, lang, args, entity);
  } finally {
    resolutionChain.delete(entity);
  }
  return rv;
}

function resolveLiteral(ctx, lang, args, expr) {
  return [{}, expr.value];
}

function resolveBuiltin(ctx, lang, args, expr) {
  if (KNOWN_MACROS.indexOf(expr) > -1) {
    return [{}, ctx._getMacro(lang, expr)];
  }

  throw new L10nError('Unknown reference: ' + expr);
}

function resolveArgument(ctx, lang, args, expr) {
  const id = expr.id;
  if (args && args.hasOwnProperty(id)) {
    if (typeof args[id] === 'string') {
      // wrap the substitution in bidi isolate characters
      return [{}, FSI + args[id] + PDI];
    }
    if (typeof args[id] === 'number' && !isNaN(args[id])) {
      const formatter = ctx._getNumberFormatter(lang);
      return [{}, formatter.format(args[id])];
    } else {
      throw new L10nError('Arg must be a string or a number: ' + id);
    }
  }

  throw new L10nError('Unknown reference: ' + id);
}

function resolveMessage(ctx, lang, args, expr) {
  const id = expr.id;
  const entity = ctx._getEntity(lang, id);

  if (entity) {
    const [locals, value] = format(ctx, lang, args, entity);
    if (value.length >= MAX_PLACEABLE_LENGTH) {
      throw new L10nError('Too many characters in placeable (' +
                          value.length + ', max allowed is ' +
                          MAX_PLACEABLE_LENGTH + ')');
    }
    return [locals, value];
  }

  throw new L10nError('Unknown reference: ' + id);
}

function resolveCall(ctx, lang, args, expr) {
  const [, callee] = resolveBuiltin(ctx, lang, args, expr.callee);
  return [{}, callee.apply(
    null,
    expr.args.map(
      argExpr => resolveExpression({}, ctx, lang, args, argExpr)[1]
    )
  )];
}

function resolveMember(ctx, lang, args, expr) {
  const object = expr.object;
  const property = expr.property;
  const entity = ctx._getEntity(lang, object);

  if (entity) {
    return resolvePlaceable({}, ctx, lang, args, entity[0], property);
  }

  throw new L10nError('Unknown variant: ' + property);
}

function defaultVariant(variants) {
  for (let variant of variants) {
    if (variant.default) {
      return variant;
    }
  }

  throw new L10nError('No default variant found');
}

function resolvePlaceable(locals, ctx, lang, args, placeable, explicit) {
  try {
    const expr = explicit ||
      placeable.expr && 
        resolveExpression(locals, ctx, lang, args, placeable.expr)[1];

    if (!expr) {
      return resolveValue(
        locals, ctx, lang, args, defaultVariant(placeable.variants).value
      );
    }

    if (!placeable.variants) {
      return [locals, expr];
    }

    if (typeof expr === 'function') {
      for (let variant of placeable.variants) {
        if (expr(variant.selector)) {
          return resolveValue(locals, ctx, lang, args, variant.value);
        }
      }
    } else {
      for (let variant of placeable.variants) {
        if (expr === variant.selector) {
          return resolveValue(locals, ctx, lang, args, variant.value);
        }
      }
    }

    return resolveValue(
      locals, ctx, lang, args, defaultVariant(placeable.variants).value
    );
  } catch (err) {
    return [{ error: err }, FSI + '{ }' + PDI];
  }
}

function resolveExpression(locals, ctx, lang, args, expr) {
  // XXX switch?
  if (expr.type === 'callExpression') {
    return resolveCall(ctx, lang, args, expr);
  } else if (expr.type === 'memberExpression') {
    return resolveMember(ctx, lang, args, expr);
  } else if (expr.type === 'argumentExpression') {
    return resolveArgument(ctx, lang, args, expr);
  } else if (expr.type === 'messageExpression') {
    return resolveMessage(ctx, lang, args, expr);
  } else if (expr.type === 'literalExpression') {
    return resolveLiteral(ctx, lang, args, expr);
  } else {
    throw new L10nError('Unknown placeable type');
  }
}

function resolveValue(locals, ctx, lang, args, elements) {
  return elements.reduce(([localsSeq, valueSeq], cur) => {
    if (cur.type === 'textElement') {
      return [localsSeq, valueSeq + cur.value];
    } else if (cur.type === 'placeableElement') {
      const [, value] = resolvePlaceable(locals, ctx, lang, args, cur);
      return [localsSeq, valueSeq + value];
    } else {
      throw new L10nError('Unresolvable value');
    }
  }, [locals, '']);
}
