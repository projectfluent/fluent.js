import { L10nError } from './errors';

const KNOWN_BUILTINS = ['PLURAL', 'NUMBER', 'LIST'];
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
  return FSI + wrapped.format(
    elem => stringify(res, elem)
  ) + PDI;
}

function stringifyList(res, list) {
  // the most common scenario; avoid creating a ListFormat instance
  if (list.length === 1) {
    return stringify(res, list[0]);
  }

  const builtin = res.ctx._getBuiltin(res.lang, 'LIST');
  return builtin(...list).format(
    elem => stringify(res, elem)
  );

  // XXX add this back later
  // if (value.length >= MAX_PLACEABLE_LENGTH) {
  //   throw new L10nError(
  //     'Too many characters in placeable (' + value.length +
  //       ', max allowed is ' + MAX_PLACEABLE_LENGTH + ')'
  //   );
  // }

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

  throw new L10nError('No value: ' + entity.id);
}


// resolve* functions can throw and return a single value

function resolveExpression(res, expr) {
  switch (expr.type) {
    case 'MemberExpression':
      return resolveMemberExpression(res, expr);
    case 'EntityReference':
      return resolveEntityReference(res, expr);
    case 'PlaceableExpression':
      return resolvePlaceableExpression(res, expr);
    default:
      return expr;
  }
}

function resolveValue(res, expr) {
  const node = resolveExpression(res, expr);
  switch (node.type) {
    case 'TextElement':
    case 'Keyword':
      return node.value;
    case 'Number':
      return parseFloat(node.value);
    case 'Variable':
      return resolveVariable(res, node);
    case 'Placeable':
      return resolvePlaceable(res, node);
    case 'String':
      return resolvePattern(res, node);
    case 'Member':
      return resolvePattern(res, node.value);
    case 'CallExpression':
      return resolveCallExpression(res, expr);
    case 'Entity':
      return resolvePattern(res, getValueNode(node).value);
    default:
      throw new L10nError('Unknown expression type');
  }
}

function resolveEntityReference(res, expr) {
  const entity = res.ctx._getEntity(res.lang, expr.id);

  if (!entity) {
    throw new L10nError('Unknown entity: ' + expr.id);
  }

  return entity;
}

function resolveVariable(res, expr) {
  const id = expr.id;
  const args = res.args;

  if (args && args.hasOwnProperty(id)) {
    return args[id];
  }

  throw new L10nError('Unknown variable: ' + id);
}

function resolveCallExpression(res, expr) {
  const callee = expr.callee.id;

  if (KNOWN_BUILTINS.indexOf(callee) === -1) {
    throw new L10nError('Unknown built-in: ' + callee);
  }

  const builtin = res.ctx._getBuiltin(res.lang, callee);
  const args = expr.args.map(
    arg => resolveValue(res, arg)
  );
  return builtin(...args);
}

function resolveTrait(res, traits, key) {
  for (let trait of traits) {
    if (key === resolveValue(res, trait.key)) {
      return trait;
    }
  }

  throw new L10nError('Unknown trait: ' + key);
}

function resolveMemberExpression(res, expr) {
  const entity = resolveExpression(res, expr.idref);
  const key = resolveValue(res, expr.keyword);

  return resolveTrait(res, entity.traits, key);
}

// XXX replace with SelectExpression
function resolveVariant(res, variants, expr) {
  const wrapped = wrap(res, expr);
  for (let variant of variants) {
    if (wrapped.equals(resolveValue(res, variant.key))) {
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


// XXX remove
function resolvePlaceableExpression(res, expression) {
  return expression.variants === null ?
    resolveExpression(res, expression.expression) :
    resolveVariant(
      res, expression.variants, resolveValue(
        res, expression.expression
      )
    )
}

function resolvePlaceable(res, placeable) {
  return placeable.expressions.map(
    expr => resolveValue(res, expr)
  );
}

function resolvePattern(res, ptn) {
  if (res.dirty.has(ptn)) {
    const ref = ptn.id || ptn.key;
    throw new L10nError('Cyclic reference: ' + ref);
  }

  res.dirty.add(ptn);
  const [errs, str] = formatPattern(res, ptn);

  if (errs.length) {
    throw new L10nError('Broken value.');
  }

  return str;
}


// formatPattern collects errors and returns them as the first element of 
// the return tuple: [errors, value]

function formatPattern(res, ptn) {
  return ptn.elements.reduce(([errs, seq], elem) => {
    if (elem.type === 'TextElement') {
      return [errs, seq + elem.value];
    } else if (elem.type === 'Placeable') {
      try {
        return [errs, seq + stringifyList(res, resolveValue(res, elem))];
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
  return formatPattern(res, node.value);
}
