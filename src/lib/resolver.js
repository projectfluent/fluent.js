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

function DefaultMember(members) {
  for (let member of members) {
    if (member.default) {
      return member;
    }
  }

  throw new L10nError('No default.');
}


// Half-resolved expressions

function Expression(res, expr) {
  switch (expr.type) {
    case 'EntityReference':
      return EntityReference(res, expr);
    case 'MemberExpression':
      return MemberExpression(res, expr);
    case 'PlaceableExpression':
      return SelectExpression(res, expr);
    default:
      return expr;
  }
}

function EntityReference(res, expr) {
  const entity = res.ctx._getEntity(res.lang, expr.id);

  if (!entity) {
    throw new L10nError('Unknown entity: ' + expr.id);
  }

  return entity;
}

function MemberExpression(res, expr) {
  const entity = Expression(res, expr.idref);
  const key = Value(res, expr.keyword);

  for (let trait of entity.traits) {
    if (key === Value(res, trait.key)) {
      return trait;
    }
  }

  throw new L10nError('Unknown trait: ' + key);
}

function SelectExpression(res, expr) {
  // XXX remove
  if (expr.variants === null) {
    return Expression(res, expr.expression);
  }

  const wrapped = wrap(res, Value(res, expr.expression));
  for (let variant of expr.variants) {
    if (wrapped.equals(Value(res, variant.key))) {
      return variant;
    }
  }

  return DefaultMember(expr.variants);
}


// Fully-resolved expressions

function Value(res, expr) {
  const node = Expression(res, expr);
  switch (node.type) {
    case 'TextElement':
    case 'Keyword':
      return node.value;
    case 'Number':
      return parseFloat(node.value);
    case 'Variable':
      return Variable(res, node);
    case 'Placeable':
      return Placeable(res, node);
    case 'CallExpression':
      return CallExpression(res, expr);
    case 'String':
      return Pattern(res, node);
    case 'Member':
      return Pattern(res, node.value);
    case 'Entity':
      return Entity(res, node);
    default:
      throw new L10nError('Unknown expression type');
  }
}

function Variable(res, expr) {
  const id = expr.id;
  const args = res.args;

  if (args && args.hasOwnProperty(id)) {
    return args[id];
  }

  throw new L10nError('Unknown variable: ' + id);
}

function Placeable(res, placeable) {
  return placeable.expressions.map(
    expr => Value(res, expr)
  );
}


function CallExpression(res, expr) {
  const callee = expr.callee.id;

  if (KNOWN_BUILTINS.indexOf(callee) === -1) {
    throw new L10nError('Unknown built-in: ' + callee);
  }

  const builtin = res.ctx._getBuiltin(res.lang, callee);
  const args = expr.args.map(
    arg => Value(res, arg)
  );
  return builtin(...args);
}

function Pattern(res, ptn) {
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

function Entity(res, entity) {
  const value = entity.value !== null ?
    entity.value : DefaultMember(entity.traits).value;

  return Pattern(res, value);
}


// formatPattern collects errors and returns them as the first element of 
// the return tuple: [errors, value]

function formatPattern(res, ptn) {
  return ptn.elements.reduce(([errs, seq], elem) => {
    if (elem.type === 'TextElement') {
      return [errs, seq + elem.value];
    } else if (elem.type === 'Placeable') {
      try {
        return [errs, seq + stringifyList(res, Value(res, elem))];
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

  try {
    const value = entity.value !== null ?
      entity.value : DefaultMember(entity.traits).value;
    res.dirty.add(value);
    return formatPattern(res, value);
  } catch (e) {
    const err = new L10nError('No value: ' + entity.id);
    return [[err], null];
  }
}
