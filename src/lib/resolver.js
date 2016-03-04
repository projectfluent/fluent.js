import { L10nError } from './errors';

const KNOWN_BUILTINS = ['PLURAL', 'NUMBER'];
const MAX_PLACEABLE_LENGTH = 2500;

// Unicode bidi isolation characters
const FSI = '\u2068';
const PDI = '\u2069';


// Helper for converting primitives into builtins

function wrap(res, expr) {
  if (typeof expr === 'object' && expr.equals) {
    return expr;
  }

  if (typeof expr === 'number') {
    return res.ctx._getBuiltin(res.lang, 'NUMBER')(expr);
  }

  if (typeof expr === 'string') {
    return {
      equals(other) {
        return other === expr;
      },
      format() {
        return expr;
      }
    };
  }
}


// Helper functions for inserting a placeable value into a string

function stringify(res, value) {
  const wrapped = wrap(res, value);
  return FSI + wrapped.format() + PDI;
}

function stringifyList(res, list) {
  const values = list.map(
    elem => stringify(res, elem)
  );

  // the most common scenario; avoid creating a ListFormat instance
  if (values.length === 1) {
    return values[0];
  }

  const builtin = res.ctx._getBuiltin(res.lang, 'LIST');
  return builtin(...values).format();
}


// Helper for choosing entity value

function getValueNode(entity) {
  if (entity.value !== null) {
    return entity;
  }

  for (let trait of entity.traits) {
    if (trait.default) {
      return trait;
    }
  }

  return null;
}


// resolve* functions can throw and return a single value

function resolve(res, expr) {
  // XXX remove
  if (typeof expr === 'string') {
    return expr;
  }

  switch (expr.type) {
    case 'EntityReference':
      return resolveEntityReference(res, expr);
    case 'Variable':
      return resolveVariable(res, expr);
    // XXX case 'Keyword':
    //  return resolveKeyword(res, expr);
    case 'Number':
      return resolveNumber(res, expr);
    case 'CallExpression':
      return resolveCallExpression(res, expr);
    case 'MemberExpression':
      return resolveMemberExpression(res, expr);
    default:
      throw new L10nError('Unknown placeable type');
  }
}

function resolveEntity(res, id) {
  const entity = res.ctx._getEntity(res.lang, id);

  if (!entity) {
    throw new L10nError('Unknown entity: ' + id);
  }

  return entity;
}

function resolveEntityReference(res, expr) {
  const id = expr.id;
  const entity = resolveEntity(res, id);
  const node = getValueNode(entity);

  if (node === null) {
    throw new L10nError('No value: ' + id);
  }

  return resolveValue(res, node);
}

function resolveVariable(res, expr) {
  const id = expr.id;
  const args = res.args;

  if (args && args.hasOwnProperty(id)) {
    return args[id];
  }

  throw new L10nError('Unknown variable: ' + id);
}

function resolveKeyword(res, expr) {
  return expr.value;
}

function resolveNumber(res, expr) {
  return parseInt(expr.value);
}

function resolveCallExpression(res, expr) {
  const id = expr.callee.id;

  if (KNOWN_BUILTINS.indexOf(id) === -1) {
    throw new L10nError('Unknown built-in: ' + id);
  }

  const callee = res.ctx._getBuiltin(res.lang, id);
  return callee(
    ...expr.args.map(
      arg => resolve(res, arg)
    )
  );
}

function resolveTrait(res, traits, key) {
  for (let trait of traits) {
    if (key === resolve(res, trait.key)) {
      return trait;
    }
  }

  throw new L10nError('Unknown trait: ' + key);
}

function resolveMemberExpression(res, expr) {
  const id = expr.idref.id;
  const key = expr.keyword;
  const entity = resolveEntity(res, id);

  return resolveValue(
    res, resolveTrait(res, entity.traits, key)
  );
}

function resolveVariant(res, variants, expr) {
  const wrapped = wrap(res, expr);
  for (let variant of variants) {
    if (wrapped.equals(resolve(res, variant.key))) {
      return variant;
    }
  }

  for (let variant of variants) {
    if (variant.default) {
      return variant;
    }
  }

  throw new L10nError('No default variant found');
}


function resolvePlaceableExpression(res, expression) {
  const expr = resolve(res, expression.expression);

  const value = expression.variants === null ?
    expr :
    resolveValue(
      res, resolveVariant(res, expression.variants, expr)
    );

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

function resolveValue(res, node) {
  if (res.dirty.has(node)) {
    const ref = node.id || node.key;
    throw new L10nError('Cyclic reference: ' + ref);
  }

  res.dirty.add(node);
  const [errs, str] = formatElements(res, node.value);

  if (errs.length) {
    throw new L10nError('Broken value.');
  }

  return str;
}


// formatElements collects any errors and return them as the first element of 
// the return tuple: [errors, value]

function formatElements(res, value) {
  return value.elements.reduce(([errs, seq], elem) => {
    if (elem.type === 'TextElement') {
      return [errs, seq + elem.value];
    } else if (elem.type === 'Placeable') {
      try {
        return [errs, seq + stringifyList(res, resolvePlaceable(res, elem))];
      } catch(e) {
        return [[...errs, e], seq + stringify(res, '{' + elem.source + '}')];
      }
    }
  }, [[], '']);
}

export function format(ctx, lang, args, entity) {
  const res = {
    ctx,
    lang,
    args,
    errors: [],
    dirty: new WeakSet()
  };

  const node = getValueNode(entity);
  if (node === null) {
    const err = new L10nError('No value: ' + entity.id);
    return [[err], null];
  }

  res.dirty.add(node);
  return formatElements(res, node.value);
}
