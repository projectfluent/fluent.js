import { L10nError } from './errors';

const KNOWN_MACROS = ['PLURAL'];
const MAX_PLACEABLE_LENGTH = 2500;

// Unicode bidi isolation characters
const FSI = '\u2068';
const PDI = '\u2069';


// Helper functions for inserting a placeable value into a string

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

function stringifyList(res, list) {
  const values = list.map(
    elem => stringify(res, elem)
  );

  // the most common scenario; avoid creating a ListFormat instance
  if (values.length === 1) {
    return values[0];
  }

  const formatter = res.ctx._getListFormatter(res.lang);
  return formatter.format(values);
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


// resolve* functions can throw and return a single value

function resolve(res, expr) {
  // XXX remove
  if (typeof expr === 'string') {
    return expr;
  }

  switch (expr.type) {
    case 'EntityReference':
      return resolveEntity(res, expr);
    case 'Variable':
      return resolveVariable(res, expr);
    // XXX case 'Keyword':
    //  return resolveKeyword(res, expr);
    case 'Number':
      return resolveNumber(res, expr);
    case 'CallExpression':
      return resolveCall(res, expr);
    case 'MemberExpression':
      return resolveTrait(res, expr);
    default:
      throw new L10nError('Unknown placeable type');
  }
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

  const value = entity.value !== null ?
    entity.value :
    chooseTrait(entity).value;

  return resolveValue(res, value);
}

function resolveVariable(res, expr) {
  const id = expr.id;
  const args = res.args;

  if (args && args.hasOwnProperty(id)) {
    return args[id];
  }

  throw new L10nError('Unknown reference: ' + id);
}

function resolveKeyword(res, expr) {
  return expr.value;
}

function resolveNumber(res, expr) {
  return parseInt(expr.value);
}

function resolveCall(res, expr) {
  const id = expr.callee.name;

  if (KNOWN_MACROS.indexOf(id) === -1) {
    throw new L10nError('Unknown reference: ' + id);
  }

  const callee = res.ctx._getMacro(res.lang, id);
  return callee(
    ...expr.args.map(
      arg => resolve(res, arg)
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

function resolveVariant(res, variants, expr) {
  if (typeof expr === 'function') {
    for (let variant of variants) {
      if (expr(resolve(res, variant.key))) {
        return resolveValue(res, variant.value);
      }
    }
  } else {
    for (let variant of variants) {
      if (expr === resolve(res, variant.key)) {
        return resolveValue(res, variant.value);
      }
    }
  }

  for (let variant of variants) {
    if (variant.default) {
      return resolveValue(res, variant.value);
    }
  }

  throw new L10nError('No default variant found');
}


function resolvePlaceableExpression(res, expression) {
  const expr = resolve(res, expression.expression);

  const value = expression.variants === null ?
    expr :
    resolveVariant(res, expression.variants, expr);

  if (value.length >= MAX_PLACEABLE_LENGTH) {
    throw new L10nError(
      'Too many characters in placeable (' + value.length +
        ', max allowed is ' + MAX_PLACEABLE_LENGTH + ')'
    );
  }

  return value;
}

function resolvePlaceable(res, placeable) {
  return placeable.expressions.map(
    expr => resolvePlaceableExpression(res, expr)
  );
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
    if (elem.type === 'TextElement') {
      return [errs, seq + elem.value];
    } else if (elem.type === 'Placeable') {
      try {
        return [errs, seq + stringifyList(res, resolvePlaceable(res, elem))];
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
