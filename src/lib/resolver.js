import { L10nError } from './errors';
import builtins, {
  FTLText, FTLNumber, FTLDateTime, FTLKeyword, FTLList
} from './builtins';

// Unicode bidi isolation characters
const FSI = '\u2068';
const PDI = '\u2069';

const MAX_PLACEABLE_LENGTH = 2500;

function mapValues(rc, arr) {
  return arr.reduce(
    ([valseq, errseq], cur) => {
      const [value, errs] = Value(rc, cur);
      return [valseq.concat(value), errseq.concat(errs)];
    }, [new FTLList(), []]
  );
}

function unit(val) {
  return [val, []];
}

function fail(val, err) {
  return [val, [err]];
}


// Helper for choosing entity value

function DefaultMember(members) {
  for (let member of members) {
    if (member.def) {
      return unit(member);
    }
  }

  return ['???', new L10nError('No default')];
}


// Half-resolved expressions

function Expression(rc, expr) {
  switch (expr.type) {
    case 'ref':
      return EntityReference(rc, expr);
    case 'blt':
      return BuiltinReference(rc, expr);
    case 'mem':
      return MemberExpression(rc, expr);
    case 'sel':
      return SelectExpression(rc, expr);
    default:
      return unit(expr);
  }
}

function EntityReference(rc, expr) {
  const entity = rc.ctx._getEntity(rc.lang, expr.name);

  if (!entity) {
    return fail(expr.name, new L10nError('Unknown entity: ' + expr.name));
  }

  return unit(entity);
}

function BuiltinReference(rc, expr) {
  const builtin = builtins[expr.name];

  if (!builtin) {
    return [
      expr.name + '()', new L10nError('Unknown built-in: ' + expr.name + '()')
    ];
  }

  return unit(builtin);
}

function MemberExpression(rc, expr) {
  const [entity, errs1] = Expression(rc, expr.obj);
  if (errs1.length) {
    const [fallback, errs2] = Value(rc, entity);
    return [fallback, [...errs1, errs2]]
  }

  const [key] = Value(rc, expr.key);

  for (let member of entity.traits) {
    const [memberKey] = Value(rc, member.key);
    if (key.match(rc, memberKey)) {
      return unit(member);
    }
  }

  const [fallback, errs2] = Value(rc, entity);
  return [
    fallback, [...errs2, new L10nError('Unknown trait: ' + key.toString(rc))]
  ];
}

function SelectExpression(rc, expr) {
  const [selector, selErrs] = Value(rc, expr.exp);
  if (selErrs.length) {
    const [fallback, errs2] = Value(rc, entity);
    return [fallback, [...selErrs, errs2]];
  }

  for (let variant of expr.vars) {
    const [key] = Value(rc, variant.key);

    if (key instanceof FTLNumber &&
        selector instanceof FTLNumber &&
        key.valueOf() === selector.valueOf()) {
      return unit(variant);
    }

    if (key instanceof FTLKeyword &&
        key.match(rc, selector)) {
      return unit(variant);
    }
  }

  return DefaultMember(expr.vars);
}


// Fully-resolved expressions

function Value(rc, expr) {
  if (typeof expr === 'string' || expr === null) {
    return unit(expr);
  }

  if (Array.isArray(expr)) {
    return Pattern(rc, expr);
  }

  const [node, errs] = Expression(rc, expr);

  if (errs.length) {
    const [fallback, fberrs] = Value(rc, node);
    return [fallback, [...errs, fberrs]];
  }

  switch (node.type) {
    case 'kw':
      return unit(new FTLKeyword(node));
    case 'num':
      return unit(new FTLNumber(node.val));
    case 'ext':
      return ExternalArgument(rc, node);
    case 'call':
      return CallExpression(rc, expr);
    default:
        // is it a Member?
        return node.key ? Value(rc, node.val) : Entity(rc, node);
  }
}

function ExternalArgument(rc, expr) {
  const name = expr.name;
  const args = rc.args;

  if (!args || !args.hasOwnProperty(name)) {
    return fail(name, new L10nError('Unknown external: ' + name));
  }

  const arg = args[name];

  switch (typeof arg) {
    case 'string':
      return unit(arg);
    case 'number':
      return unit(new FTLNumber(arg));
    case 'object':
      if (Array.isArray(arg)) {
        return mapValues(rc, arg);
      }
      if (arg instanceof Date) {
        return unit(new FTLDateTime(arg));
      }
    default:
      return fail(name, new L10nError(
        'Unsupported external type: ' + name + ', ' + typeof arg
      ));
  }
}

function CallExpression(rc, expr) {
  const [callee, errs1] = Expression(rc, expr.name);
  if (errs1.length) {
    return [callee, errs1];
  }

  const [pargs, kargs, errs2] = expr.args.reduce(
    ([pargseq, kargseq, errseq], arg) => {
      if (arg.type === 'kv') {
        const [val, errs] = Value(rc, arg.val);
        kargseq[arg.name] = val;
        return [pargseq, kargseq, [...errseq, ...errs]];
      } else {
        const [val, errs] = Value(rc, arg);
        return [[...pargseq, val], kargseq, [...errseq, ...errs]];
      }
    }, [[], {}, []]);
  return [callee(pargs, kargs), errs2];
}

function Pattern(rc, ptn) {
  if (rc.dirty.has(ptn)) {
    return fail('???', new L10nError('Cyclic reference'));
  }

  rc.dirty.add(ptn);

  const rv = ptn.reduce(([valseq, errseq], elem) => {
    if (typeof elem === 'string') {
      return [valseq + elem, errseq];
    } else {
      const [value, errs] = elem.length === 1 ?
        Value(rc, elem[0]) : mapValues(rc, elem);
      const str = value.toString(rc);
      if (str.length > MAX_PLACEABLE_LENGTH) {
        return [
          valseq + '???',
          [...errseq, ...errs, new L10nError(
            'Too many characters in placeable ' +
            `(${str.length}, max allowed is ${MAX_PLACEABLE_LENGTH})`
          )]
        ];
      }
      return [
        valseq + FSI + str + PDI, [...errseq, ...errs],
      ];
    }

  }, ['', []]);

  rc.dirty.delete(ptn);
  return rv;
}

function Entity(rc, entity) {
  if (!entity.traits) {
    return Value(rc, entity);
  }

  if (entity.val !== undefined) {
    return Value(rc, entity.val);
  }

  const [def, errs] = DefaultMember(entity.traits);

  if (errs.length) {
    return ['???', [...errs, new L10nError('No value')]];
  }

  return Value(rc, def.val);
}


export function format(ctx, lang, args, entity) {
  // rc is the current resolution context
  const rc = {
    ctx,
    lang,
    args,
    dirty: new WeakSet()
  };

  return Value(rc, entity);
}
