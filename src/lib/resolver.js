import { L10nError } from './errors';
import builtins, {
  FTLNone, FTLText, FTLNumber, FTLKeyValueArg, FTLKeyword, FTLList
} from './builtins';

const MAX_PLACEABLE_LENGTH = 2500;

// Unicode bidi isolation characters
const FSI = '\u2068';
const PDI = '\u2069';

function getId(entity) {
  return entity.ns ?
    `${entity.ns}/${entity.id}` : entity.id;
}

function mapValues(res, arr) {
  return arr.reduce(
    ([errSeq, valSeq], cur) => {
      const [errs, value] = Value(res, cur);
      return [
        [...errSeq, ...errs],
        new FTLList([...valSeq.value, value]),
      ];
    },
    [[], new FTLList([])]
  );
}

  // XXX add this back later
  // if (value.length >= MAX_PLACEABLE_LENGTH) {
  //   throw new L10nError(
  //     'Too many characters in placeable (' + value.length +
  //       ', max allowed is ' + MAX_PLACEABLE_LENGTH + ')'
  //   );
  // }

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
    unit(new FTLNone())
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
  const entity = res.ctx._getEntity(res.lang, getId(expr));

  if (!entity) {
    return fail(
      [new L10nError('Unknown entity: ' + getId(expr))],
      unit(new FTLText(expr.id))
    );
  }

  return unit(entity);
}

function BuiltinReference(res, expr) {
  const builtin = builtins[expr.id];

  if (!builtin) {
    return fail(
      [new L10nError('Unknown built-in: ' + expr.id)],
      unit(new FTLText(expr.id + '()'))
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
    if (key.match(res, memberKey)) {
      return unit(member);
    }
  }

  return fail(
    [new L10nError('Unknown trait: ' + key.format(res))],
    Value(res, entity)
  );
}

function SelectExpression(res, expr) {
  const [selErrs, selector] = Value(res, expr.expression);
  if (selErrs.length) {
    return fail(selErrs, DefaultMember(expr.variants));
  }

  for (let variant of expr.variants) {
    const [, key] = Value(res, variant.key);
    if (selector.match(res, key)) {
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
      return unit(new FTLText(node.value));
    case 'Keyword':
      return unit(new FTLKeyword(node.value, node.namespace));
    case 'Number':
      return unit(new FTLNumber(node.value));
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

  if (!args || !args.hasOwnProperty(id)) {
    return fail(
      [new L10nError('Unknown variable: ' + id)],
      unit(new FTLNone(id))
    );
  }

  const arg = args[id];

  switch (typeof arg) {
    case 'number': return unit(new FTLNumber(arg));
    case 'string': return unit(new FTLText(arg));
    default: return fail(
      [new L10nError('Unsupported variable type: ' + id + ', ' + typeof arg)],
      unit(new FTLNone(id))
    );
  }
}

function KeyValueArg(res, expr) {
  const [errs, value] = Value(res, expr.value);
  return [
    errs,
    new FTLKeyValueArg(value, expr.id)
  ];
}

function CallExpression(res, expr) {
  const [errs1, callee] = Expression(res, expr.callee);
  if (errs1.length) {
    return fail(errs1, unit(callee));
  }


  const [errs2, args] = mapValues(res, expr.args);
  const [pargs, kargs] = args.value.reduce(
    ([pargs, kargs], arg) => arg instanceof FTLKeyValueArg ?
      [pargs, Object.assign({}, kargs, {
        [arg.id]: arg.value
      })] :
      [[...pargs, arg], kargs],
    [[], {}]);
  return [errs2, callee(pargs, kargs)];
}

function Pattern(res, ptn) {
  if (res.dirty.has(ptn)) {
    return fail(
      [new L10nError('Cyclic reference')],
      unit(new FTLNone())
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
      [...errs, new L10nError('No value: ' + getId(entity))],
      unit(new FTLText(getId(entity)))
    );
  }

  return Pattern(res, def.value);
}


// formatPattern collects errors and returns them as the first element of 
// the return tuple: [errors, value]

function formatPattern(res, ptn) {
  return ptn.elements.reduce(([errSeq, valSeq], elem) => {
    const [errs, value] = Value(res, elem);
    return [
      [...errSeq, ...errs],
      elem.type === 'Placeable' ?
        new FTLText(valSeq.format(res) + FSI + value.format(res) + PDI) :
        new FTLText(valSeq.format(res) + value.format(res))
    ];
  }, [[], new FTLText('')]);
}

export function format(ctx, lang, args, entity) {
  const res = {
    ctx,
    lang,
    args,
    dirty: new WeakSet()
  };

  const [errs, value] = Entity(res, entity);
  return [errs, value.format(res)];
}
