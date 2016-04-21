import { L10nError } from './errors';
import builtins, {
  FTLNone, FTLText, FTLNumber, FTLKeyValueArg, FTLKeyword, FTLList
} from './builtins';

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
    if (member.def) {
      return unit(member);
    }
  }

  return fail(
    [new L10nError('No default')],
    unit(new FTLNone())
  );
}


// Half-resolved expressions

function Expression(res, expr) {
  switch (expr.type) {
    case 'ref':
      return EntityReference(res, expr);
    case 'blt':
      return BuiltinReference(res, expr);
    case 'mem':
      return MemberExpression(res, expr);
    case 'sel':
      return SelectExpression(res, expr);
    default:
      return unit(expr);
  }
}

function EntityReference(res, expr) {
  const entity = res.ctx._getEntity(res.lang, expr.name);

  if (!entity) {
    return fail(
      [new L10nError('Unknown entity: ' + expr.name)],
      unit(new FTLText(expr.name))
    );
  }

  return unit(entity);
}

function BuiltinReference(res, expr) {
  const builtin = builtins[expr.name];

  if (!builtin) {
    return fail(
      [new L10nError('Unknown built-in: ' + expr.name + '()')],
      unit(new FTLText(expr.name + '()'))
    );
  }

  return unit(builtin);
}

function MemberExpression(res, expr) {
  const [errs1, entity] = Expression(res, expr.obj);
  if (errs1.length) {
    return fail(errs1, Value(res, entity));
  }

  const [, key] = Value(res, expr.key);

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
  const [selErrs, selector] = Value(res, expr.exp);
  if (selErrs.length) {
    return fail(selErrs, DefaultMember(expr.vars));
  }

  for (let variant of expr.vars) {
    const [, key] = Value(res, variant.key);
    if (selector.match(res, key)) {
      return unit(variant);
    }
  }

  return DefaultMember(expr.vars);
}


// Fully-resolved expressions

function Value(res, expr) {
  if (typeof expr === 'string') {
    return unit(new FTLText(expr));
  }

  if (Array.isArray(expr)) {
    return Pattern(res, expr);
  }

  if (expr instanceof FTLNone) {
    return unit(expr);
  }

  const [errs, node] = Expression(res, expr);
  if (errs.length) {
    return fail(errs, Value(res, node));
  }

  switch (node.type) {
    case 'id':
      return unit(new FTLKeyword(node.name, node.ns));
    case 'num':
      return unit(new FTLNumber(node.val));
    case 'ext':
      return ExternalArgument(res, node);
    case 'kv':
      return KeyValueArg(res, expr);
    case 'call':
      return CallExpression(res, expr);
    default:
      if (node.key) {
        // if it's a Member
        return Value(res, node.val);
      }
      return Entity(res, node);
  }
}

function ExternalArgument(res, expr) {
  const name = expr.name;
  const args = res.args;

  if (!args || !args.hasOwnProperty(name)) {
    return [
      [new L10nError('Unknown external: ' + name)],
      new FTLNone(name)
    ];
  }

  const arg = args[name];

  switch (typeof arg) {
    case 'number': return unit(new FTLNumber(arg));
    case 'string': return unit(new FTLText(arg));
    default:
      if (Array.isArray(arg)) {
        return mapValues(res, arg);
      }

      return [
        [new L10nError(
          'Unsupported external type: ' + name + ', ' + typeof arg
        )],
        new FTLNone(name)
      ];
  }
}

function KeyValueArg(res, expr) {
  const [errs, value] = Value(res, expr.val);
  return [
    errs,
    new FTLKeyValueArg(value, expr.name)
  ];
}

function CallExpression(res, expr) {
  const [errs1, callee] = Expression(res, expr.name);
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
  if (!entity.traits) {
    return Value(res, entity);
  }

  if (entity.val !== undefined) {
    return Value(res, entity.val);
  }

  const [errs, def] = DefaultMember(entity.traits);

  if (errs.length) {
    return fail(
      [...errs, new L10nError('No value')],
      unit(new FTLNone())
    );
  }

  return Value(res, def.val);
}


// formatPattern collects errors and returns them as the first element of 
// the return tuple: [errors, value]

function formatPattern(res, ptn) {
  return ptn.reduce(([errSeq, valSeq], elem) => {
    if (typeof elem === 'string') {
      return [errSeq, new FTLText(valSeq.format(res) + elem)];
    } else {
      const [errs, value] = mapValues(res, elem);
      return [
        [...errSeq, ...errs],
        new FTLText(valSeq.format(res) + FSI + value.format(res) + PDI),
      ];
    }

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
