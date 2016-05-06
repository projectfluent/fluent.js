import { L10nError } from './errors';
import { resolve, ask, tell, fail } from './readwrite';
import builtins, {
  FTLNumber, FTLDateTime, FTLKeyword, FTLList
} from './builtins';

// Unicode bidi isolation characters
const FSI = '\u2068';
const PDI = '\u2069';

const MAX_PLACEABLE_LENGTH = 2500;

function* mapValues(arr) {
  let values = new FTLList();
  for (let elem of arr) {
    values.push(yield* Value(elem));
  }
  return values;
}

// Helper for choosing entity value

function* DefaultMember(members) {
  for (let member of members) {
    if (member.def) {
      return yield member;
    }
  }

  return yield fail('???', new L10nError('No default'));
}


// Half-resolved expressions

function* Expression(expr) {
  switch (expr.type) {
    case 'ref':
      return yield* EntityReference(expr);
    case 'blt':
      return yield* BuiltinReference(expr);
    case 'mem':
      return yield* MemberExpression(expr);
    case 'sel':
      return yield* SelectExpression(expr);
    default:
      return yield expr;
  }
}

function* EntityReference(expr) {
  const rc = yield ask();
  const entity = rc.ctx._getEntity(rc.lang, expr.name);

  if (!entity) {
    return yield fail(expr.name, new L10nError('Unknown entity: ' + expr.name));
  }

  return yield entity;
}

function* BuiltinReference(expr) {
  const builtin = builtins[expr.name];

  if (!builtin) {
    return yield fail(
      expr.name + '()', new L10nError('Unknown built-in: ' + expr.name + '()')
    );
  }

  return yield builtin;
}

function* MemberExpression(expr) {
  const entity = yield* Expression(expr.obj);
  const key = yield* Value(expr.key);
  const rc = yield ask();

  for (let member of entity.traits) {
    const memberKey = yield* Value(member.key);
    if (key.match(rc, memberKey)) {
      return yield member;
    }
  }

  return yield fail(entity, new L10nError('Unknown trait: ' + key.toString(rc)));
}

function* SelectExpression(expr) {
  const selector = yield* Value(expr.exp);
  // if (errs.length) {
  //   return flat(DefaultMember(expr.vars), errs);
  // }

  for (let variant of expr.vars) {
    const key = yield* Value(variant.key);

    if (key instanceof FTLNumber &&
        selector instanceof FTLNumber &&
        key.valueOf() === selector.valueOf()) {
      return yield variant;
    }

    const rc = yield ask();

    if (key instanceof FTLKeyword &&
        key.match(rc, selector)) {
      return yield variant;
    }
  }

  return yield* DefaultMember(expr.vars);
}


// Fully-resolved expressions

function* Value(expr) {
  if (typeof expr === 'string' || expr === null) {
    return yield expr;
  }

  if (Array.isArray(expr)) {
    return yield* Pattern(expr);
  }

  const node = yield* Expression(expr);
  // if (errs.length) {
  //   // Expression short-circuited into a simple string or a fallback
  //   return flat(Value(rc, node), errs);
  // }

  switch (node.type) {
    case 'kw':
      return yield new FTLKeyword(node);
    case 'num':
      return yield new FTLNumber(node.val);
    case 'ext':
      return yield* ExternalArgument(node);
    case 'call':
      return yield* CallExpression(expr);
    default:
      return node.key ? // is it a Member?
        yield* Value(node.val) :
        yield* Entity(node);
  }
}

function* ExternalArgument(expr) {
  const name = expr.name;
  const { args } = yield ask();

  if (!args || !args.hasOwnProperty(name)) {
    return yield fail(name, new L10nError('Unknown external: ' + name));
  }

  const arg = args[name];

  switch (typeof arg) {
    case 'string':
      return yield arg;
    case 'number':
      return yield new FTLNumber(arg);
    case 'object':
      if (Array.isArray(arg)) {
        return yield* mapValues(arg);
      }
      if (arg instanceof Date) {
        return yield new FTLDateTime(arg);
      }
    default:
      return yield fail(name, new L10nError(
        'Unsupported external type: ' + name + ', ' + typeof arg
      ));
  }
}

function* CallExpression(expr) {
  const callee = yield* Expression(expr.name);

  // if (errs1.length) {
  //   return [callee, errs1];
  // }

  let pargs = [];
  let kargs = [];

  for (let arg of expr.args) {
    if (arg.type === 'kv') {
      const val = yield* Value(arg.val);
      kargs[arg.name] = val;
    } else {
      const val = yield* Value(arg);
      pargs.push(val);
    }
  }

  return yield callee(pargs, kargs);
}

function* Pattern(ptn) {
  const rc = yield ask();

  if (rc.dirty.has(ptn)) {
    return yield fail('???', new L10nError('Cyclic reference'));
  }

  rc.dirty.add(ptn);

  let result = '';

  for (let part of ptn) {
    if (typeof part === 'string') {
      result += part;
    } else {
      const value = part.length === 1 ?
        yield* Value(part[0]) : yield* mapValues(part);

      const str = value.toString(rc);
      if (str.length > MAX_PLACEABLE_LENGTH) {
        yield tell(new L10nError(
          'Too many characters in placeable ' +
          `(${str.length}, max allowed is ${MAX_PLACEABLE_LENGTH})`
        ));
        result += '???';
      } else {
        result += FSI + str + PDI;
      }
    }
  }

  rc.dirty.delete(ptn);
  return yield result;
}

function* Entity(entity) {
  if (!entity.traits) {
    return yield* Value(entity);
  }

  if (entity.val !== undefined) {
    return yield* Value(entity.val);
  }

  const def = yield* DefaultMember(entity.traits);
  return yield* Value(def);
}


export function format(ctx, lang, args, entity) {
  const res = resolve(function* () {
    return yield* Value(entity);
  }());

  const ret = res.run({
    ctx,
    lang,
    args,
    dirty: new WeakSet()
  });

  return ret;
}
