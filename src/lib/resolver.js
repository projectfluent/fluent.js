import { L10nError } from './errors';

const MAX_PLACEABLE_LENGTH = 2500;

// Unicode bidi isolation characters
const FSI = '\u2068';
const PDI = '\u2069';


function mapValues(res, arr) {
  return arr.reduce(
    ([errSeq, valSeq], cur) => {
      const [errs, value] = Value(res, cur);
      return [
        [...errSeq, ...errs],
        [...valSeq, value],
      ];
    },
    [[], []]
  );
}


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

function unit(val) {
  return [[], val];
}

function fail(errs, salvage = null) {
  return [errs, salvage];
}

function error(err, salvage) {
  return fail([err], salvage);
}

// Helper for choosing entity value

function DefaultMember(members) {
  for (let member of members) {
    if (member.default) {
      return unit(member);
    }
  }

  return error(new L10nError('No default.'));
}


// Half-resolved expressions

function Expression(res, expr) {
  switch (expr.type) {
    case 'EntityReference':
      return EntityReference(res, expr);
    case 'BuiltinReference':
      return BuiltinReference(res, expr);
    case 'MemberExpression':
      return TraitExpression(res, expr);
    case 'SelectExpression':
      return SelectExpression(res, expr);
    default:
      return unit(expr);
  }
}

function EntityReference(res, expr) {
  const entity = res.ctx._getEntity(res.lang, expr.id);

  if (!entity) {
    return error(new L10nError('Unknown entity: ' + expr.id), expr.id);
  }

  return unit(entity);
}

function BuiltinReference(res, expr) {
  const builtin = res.ctx._getBuiltin(res.lang, expr.id);

  if (!builtin) {
    return error(new L10nError('Unknown built-in: ' + expr.id), expr.id);
  }

  return unit(builtin);
}

function TraitExpression(res, expr) {
  const [errs1, entity] = Expression(res, expr.idref);
  if (errs1.length) {
    return fail(errs1, entity);
  }

  const [, key] = Value(res, expr.keyword);

  for (let trait of entity.traits) {
    const [, traitKey] = Value(res, trait.key);
    if (key === traitKey) {
      return unit(trait);
    }
  }

  return error(new L10nError('Unknown trait: ' + key));
}

function SelectExpression(res, expr) {
  const [selErrs, selector] = Value(res, expr.expression);
  if (selErrs.length) {
    const [defErrs, def] = DefaultMember(expr.variants);
    return fail([...selErrs, ...defErrs], def);
  }

  const wrapped = wrap(res, selector);

  for (let variant of expr.variants) {
    const [, key] = Value(res, variant.key);
    if (wrapped.equals(key)) {
      return unit(variant);
    }
  }

  return DefaultMember(expr.variants);
}


// Fully-resolved expressions

function Value(res, expr) {
  const [errs, node] = Expression(res, expr);
  if (errs.length) {
    return fail(errs, node);
  }

  switch (node.type) {
    case 'TextElement':
    case 'Keyword':
      return unit(node.value);
    case 'Number':
      return unit(parseFloat(node.value));
    case 'Variable':
      return Variable(res, node);
    case 'Placeable':
      return mapValues(res, node.expressions);
    case 'CallExpression':
      return CallExpression(res, expr);
    case 'Pattern':
      return Pattern(res, node);
    case 'Member':
      return Pattern(res, node.value);
    case 'Entity':
      return Entity(res, node);
    default:
      return error(new L10nError('Unknown expression type'));
  }
}

function Variable(res, expr) {
  const id = expr.id;
  const args = res.args;

  if (args && args.hasOwnProperty(id)) {
    return unit(args[id]);
  }

  return error(new L10nError('Unknown variable: ' + id), id);
}

function CallExpression(res, expr) {
  const [errs1, callee] = Expression(res, expr.callee);
  if (errs1) {
    fail(errs1, callee);
  }

  const [errs2, args] = mapValues(res, expr.args);
  return [errs2, callee(...args)];
}

function Pattern(res, ptn) {
  if (res.dirty.has(ptn)) {
    return error(new L10nError('Cyclic reference'));
  }

  res.dirty.add(ptn);
  return formatPattern(res, ptn);
}

function Entity(res, entity) {
  if (entity.value !== null) {
    return Pattern(res, entity.value);
  }

  const [errs, def] = DefaultMember(entity.traits);

  if (errs.length) {
    return error(new L10nError('No value: ' + entity.id), entity.id);
  }

  return Pattern(res, def.value);
}


// formatPattern collects errors and returns them as the first element of 
// the return tuple: [errors, value]

function formatPattern(res, ptn) {
  return ptn.elements.reduce(([errSeq, valSeq], elem) => {
    if (elem.type === 'TextElement') {
      return [errSeq, valSeq + elem.value];
    } else if (elem.type === 'Placeable') {
      const [errs, value] = Value(res, elem);
      if (errs.length) {
        return [
          [...errSeq, ...errs],
          valSeq + stringify(res, '{' + value + '}')
        ];
      }
      return [errSeq, valSeq + stringifyList(res, value)];
    }
  }, [[], '']);
}

export function format(ctx, lang, args, entity) {
  const res = {
    ctx,
    lang,
    args,
    dirty: new WeakSet()
  };

  return Entity(res, entity);
}
