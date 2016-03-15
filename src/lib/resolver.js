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
  if (expr === null) {
    return {
      equals() {
        return false;
      },
      format() {
        return '???';
      }
    }
  }

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

function fail(prevErrs, [errs, value]) {
  return [
    [...prevErrs, ...errs], value
  ];
}


// Helper for choosing entity value

function DefaultMember(members) {
  for (let member of members) {
    if (member.default) {
      return unit(member);
    }
  }

  return fail(
    [new L10nError('No default.')],
    unit(null)
  );
}


// Half-resolved expressions

function Expression(res, expr) {
  switch (expr.type) {
    case 'EntityReference':
      return EntityReference(res, expr);
    case 'BuiltinReference':
      return BuiltinReference(res, expr);
    case 'MemberExpression':
      return MemberExpression(res, expr);
    case 'SelectExpression':
      return SelectExpression(res, expr);
    default:
      return unit(expr);
  }
}

function EntityReference(res, expr) {
  const entity = res.ctx._getEntity(res.lang, expr.id);

  if (!entity) {
    return fail(
      [new L10nError('Unknown entity: ' + expr.id)],
      unit(expr.id + '()')
    );
  }

  return unit(entity);
}

function BuiltinReference(res, expr) {
  const builtin = res.ctx._getBuiltin(res.lang, expr.id);

  if (!builtin) {
    return fail(
      [new L10nError('Unknown built-in: ' + expr.id)],
      unit(expr.id)
    );
  }

  return unit(builtin);
}

function MemberExpression(res, expr) {
  const [errs1, entity] = Expression(res, expr.idref);
  if (errs1.length) {
    return fail(errs1, Value(res, entity));
  }

  const [, key] = Value(res, expr.keyword);

  for (let member of entity.traits) {
    const [, memberKey] = Value(res, member.key);
    if (key === memberKey) {
      return unit(member);
    }
  }

  return fail(
    [new L10nError('Unknown trait: ' + key)],
    Value(res, entity)
  );
}

function SelectExpression(res, expr) {
  const [selErrs, selector] = Value(res, expr.expression);
  if (selErrs.length) {
    return fail(selErrs, DefaultMember(expr.variants));
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
    return fail(errs, Value(res, node));
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
    case 'KeyValueArg':
      return KeyValueArg(res, expr);
    case 'CallExpression':
      return CallExpression(res, expr);
    case 'Pattern':
      return Pattern(res, node);
    case 'Member':
      return Pattern(res, node.value);
    case 'Entity':
      return Entity(res, node);
    default:
      return unit(node);
  }
}

function Variable(res, expr) {
  const id = expr.id;
  const args = res.args;

  if (args && args.hasOwnProperty(id)) {
    return unit(args[id]);
  }

  return fail(
    [new L10nError('Unknown variable: ' + id)],
    unit(id)
  );
}

function KeyValueArg(res, expr) {
  const [errs, value] = Value(res, expr.value);
  if (errs.length) {
    return fail(errs, unit(value));
  }

  return unit({
    id: expr.id,
    value: value
  });
}

function CallExpression(res, expr) {
  const [errs1, callee] = Expression(res, expr.callee);
  if (errs1.length) {
    return fail(errs1, unit(callee));
  }


  const [errs2, args] = mapValues(res, expr.args);
  return [errs2, callee(...args)];
}

function Pattern(res, ptn) {
  if (res.dirty.has(ptn)) {
    return fail(
      [new L10nError('Cyclic reference')],
      unit(null)
    );
  }

  res.dirty.add(ptn);
  const rv = formatPattern(res, ptn);
  res.dirty.delete(ptn);
  return rv;
}

function Entity(res, entity) {
  if (entity.value !== null) {
    return Pattern(res, entity.value);
  }

  const [errs, def] = DefaultMember(entity.traits);

  if (errs.length) {
    return fail(
      [...errs, new L10nError('No value: ' + entity.id)],
      unit(entity.id)
    );
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
      return [
        [...errSeq, ...errs],
        valSeq + stringifyList(res, value)
      ];
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
