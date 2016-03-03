import { L10nError } from './errors';

const KNOWN_MACROS = ['PLURAL'];
const MAX_PLACEABLE_LENGTH = 2500;

// Unicode bidi isolation characters
const FSI = '\u2068';
const PDI = '\u2069';


// Helper function for inserting a placeable value into a string

function stringify(res, value) {
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


// Helper functions for picking the right member from an array of traits or 
// variants.

function chooseTrait(entity, name) {
  for (let trait of entity.traits) {

    if (name === trait.key || (!name && trait.default)) {
      return trait;
    }
  }
}

function chooseVariant(variants, expr) {
  if (typeof expr === 'function') {
    for (let variant of variants) {
      if (expr(variant.key)) {
        return variant;
      }
    }
  } else {
    for (let variant of variants) {
      if (expr === variant.key) {
        return variant;
      }
    }
  }

  for (let variant of variants) {
    if (variant.default) {
      return variant;
    }
  }

  throw new L10nError('No default variant found');
}


// resolve* functions can throw and return a single value

function resolveEntity(res, expr) {
  const id = expr.name;
  const entity = res.ctx._getEntity(res.lang, id);

  if (!entity) {
    throw new L10nError('Unknown reference: ' + id);
  }

  if (res.dirty.has(entity)) {
    throw new L10nError('Cyclic reference: ' + id);
  }

  const value = entity.value !== null ?
    entity.value :
    chooseTrait(entity).value;

  return resolveValue(res, value);
}

function resolveVariable(res, expr) {
  const id = expr.id.name;
  const args = res.args;

  if (args && args.hasOwnProperty(id)) {
    return args[id];
  }

  throw new L10nError('Unknown reference: ' + id);
}


function resolveLiteral(res, expr) {
  return expr.value;
}

function resolveCall(res, expr) {
  const id = expr.callee.name;

  if (KNOWN_MACROS.indexOf(id) === -1) {
    throw new L10nError('Unknown reference: ' + id);
  }

  const callee = res.ctx._getMacro(res.lang, id);
  return callee(
    ...expr.args.map(
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
    throw new L10nError('Unknown trait: ' + key);
  }

  return resolveValue(res, trait.value);
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

function resolvePlaceable(res, placeable) {
  const expr = resolveExpression(res, placeable.expression);

  const value = placeable.variants === null ?
    expr :
    resolveValue(res, chooseVariant(placeable.variants, expr).value);

  if (value.length >= MAX_PLACEABLE_LENGTH) {
    throw new L10nError(
      'Too many characters in placeable (' + value.length +
        ', max allowed is ' + MAX_PLACEABLE_LENGTH + ')'
    );
  }

  return value;
}

function resolveValue(res, value) {
  const [errs, str] = formatValue(res, value);

  if (errs.length) {
    throw new L10nError('Broken value.');
  }

  return str;
}


// formatValue collects any errors and return them as the first element of 
// the return tuple: [errors, value]

function formatValue(res, value) {
  return value.elements.reduce(([errs, seq], elem) => {
    if (typeof elem === 'string') {
      return [errs, seq + elem];
    } else if (elem.type === 'Placeable') {
      try {
        return [errs, seq + stringify(res, resolvePlaceable(res, elem))];
      } catch(e) {
        return [[...errs, e], seq + stringify(res, '{}')];
      }
    } else {
      return [
        [...errs, new L10nError('Unresolvable value')],
        seq + stringify(res, '{}')
      ];
    }
  }, [[], '']);
}

export function format(ctx, lang, args, entity) {
  const res = {
    ctx,
    lang,
    args,
    errors: [],
    dirty: new WeakSet([entity])
  };

  const value = entity.value !== null ?
    entity.value :
    chooseTrait(entity).value;

  return formatValue(res, value);
}
