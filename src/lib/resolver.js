import { L10nError } from './errors';
import { resolve, ask, fail } from './readwrite';
import builtins, {
  FTLNone, FTLNumber, FTLDateTime, FTLKeyword, FTLList
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

function err(msg, fallback) {
  return fail(new FTLNone(fallback), new L10nError(msg));
}

// Helper for choosing entity value
function* DefaultMember(members) {
  for (let member of members) {
    if (member.def) {
      return yield member;
    }
  }

  return yield err('No default');
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
    return yield err(`Unknown entity: ${expr.name}`, expr.name);
  }

  return yield entity;
}

function* BuiltinReference(expr) {
  const builtin = builtins[expr.name];

  if (!builtin) {
    return yield err(`Unknown built-in: ${expr.name}()`, `${expr.name}()`);
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

  return yield err(`Unknown trait: ${key.toString(rc)}`, entity);
}

function* SelectExpression(expr) {
  const selector = yield* Value(expr.exp);
  if (selector instanceof FTLNone) {
    return yield* DefaultMember(expr.vars);
  }

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
  if (node instanceof FTLNone) {
    // Expression short-circuited into a simple string or a fallback
    return yield* Value(node);
  }

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
    return yield err(`Unknown external: ${name}`, name);
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
      return yield err(
        'Unsupported external type: ' + name + ', ' + typeof arg, name
      );
  }
}

function* CallExpression(expr) {
  const callee = yield* Expression(expr.name);

  if (callee instanceof FTLNone) {
    return callee;
  }

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
    return yield err('Cyclic reference');
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
        const trimmed = yield err(
          'Too many characters in placeable ' +
          `(${str.length}, max allowed is ${MAX_PLACEABLE_LENGTH})`,
          str.substr(0, MAX_PLACEABLE_LENGTH)
        );
        result += trimmed;
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

function* valueOf(entity) {
  return yield* Value(entity);
}

export function format(ctx, lang, args, entity) {
  if (typeof entity === 'string') {
    return [entity, []];
  }

  return resolve(valueOf(entity)).run({
    ctx, lang, args, dirty: new WeakSet()
  });
}
