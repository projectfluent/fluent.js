import { L10nError } from './errors';
import { resolve, ask, tell } from './readwrite';
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

function err(msg) {
  return tell(new L10nError(msg));
}

// Helper for choosing entity value
function* DefaultMember(members) {
  for (let member of members) {
    if (member.def) {
      return member;
    }
  }

  yield err('No default');
  return { val: new FTLNone() };
}


// Half-resolved expressions evaluate to raw Runtime AST nodes

function* EntityReference(expr) {
  const rc = yield ask();
  const entity = rc.ctx._getEntity(rc.lang, expr.name);

  if (!entity) {
    yield err(`Unknown entity: ${expr.name}`);
    return FTLNone(expr.name);
  }

  return entity;
}

function* MemberExpression(expr) {
  const entity = yield* EntityReference(expr.obj);
  if (entity instanceof FTLNone) {
    return { val: entity };
  }

  const key = yield* Value(expr.key);
  const rc = yield ask();

  for (let member of entity.traits) {
    const memberKey = yield* Value(member.key);
    if (key.match(rc, memberKey)) {
      return member;
    }
  }

  yield err(`Unknown trait: ${key.toString(rc)}`);
  return {
    val: yield* Entity(entity)
  };
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
      return variant;
    }

    const rc = yield ask();

    if (key instanceof FTLKeyword &&
        key.match(rc, selector)) {
      return variant;
    }
  }

  return yield* DefaultMember(expr.vars);
}


// Fully-resolved expressions evaluate to FTL types

function* Value(expr) {
  if (typeof expr === 'string' || expr instanceof FTLNone) {
    return expr;
  }

  if (Array.isArray(expr)) {
    return yield* Pattern(expr);
  }

  switch (expr.type) {
    case 'kw':
      return new FTLKeyword(expr);
    case 'num':
      return new FTLNumber(expr.val);
    case 'ext':
      return yield* ExternalArgument(expr);
    case 'blt':
      return yield* BuiltinReference(expr);
    case 'call':
      return yield* CallExpression(expr);
    case 'ref':
      const ref = yield* EntityReference(expr);
      return yield* Entity(ref);
    case 'mem':
      const mem = yield* MemberExpression(expr);
      return yield* Value(mem.val);
    case 'sel':
      const sel = yield* SelectExpression(expr);
      return yield* Value(sel.val);
    default:
      return yield* Value(expr.val);
  }
}

function* ExternalArgument(expr) {
  const name = expr.name;
  const { args } = yield ask();

  if (!args || !args.hasOwnProperty(name)) {
    yield err(`Unknown external: ${name}`);
    return new FTLNone(name);
  }

  const arg = args[name];

  switch (typeof arg) {
    case 'string':
      return arg;
    case 'number':
      return new FTLNumber(arg);
    case 'object':
      if (Array.isArray(arg)) {
        return yield* mapValues(arg);
      }
      if (arg instanceof Date) {
        return new FTLDateTime(arg);
      }
    default:
      yield err('Unsupported external type: ' + name + ', ' + typeof arg);
      return new FTLNone(name);
  }
}

function* BuiltinReference(expr) {
  const builtin = builtins[expr.name];

  if (!builtin) {
    yield err(`Unknown built-in: ${expr.name}()`);
    return new FTLNone(`${expr.name}()`);
  }

  return builtin;
}

function* CallExpression(expr) {
  const callee = yield* BuiltinReference(expr.name);

  if (callee instanceof FTLNone) {
    return callee;
  }

  const posargs = [];
  const keyargs = [];

  for (let arg of expr.args) {
    if (arg.type === 'kv') {
      keyargs[arg.name] = yield* Value(arg.val);
    } else {
      posargs.push(yield* Value(arg));
    }
  }

  // XXX builtins should also returns [val, errs] tuples
  return callee(posargs, keyargs);
}

function* Pattern(ptn) {
  const rc = yield ask();

  if (rc.dirty.has(ptn)) {
    yield err('Cyclic reference');
    return new FTLNone();
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
        yield err(
          'Too many characters in placeable ' +
          `(${str.length}, max allowed is ${MAX_PLACEABLE_LENGTH})`
        );
        result += FSI + str.substr(0, MAX_PLACEABLE_LENGTH) + PDI;
      } else {
        result += FSI + str + PDI;
      }
    }
  }

  rc.dirty.delete(ptn);
  return result;
}

function* Entity(entity) {
  if (entity.val !== undefined) {
    return yield* Value(entity.val);
  }

  if (!entity.traits) {
    return yield* Value(entity);
  }

  const def = yield* DefaultMember(entity.traits);
  return yield* Value(def);
}

function* toString(entity) {
  const value = yield* Entity(entity);

  // at this point we don't need the current resolution context; value can 
  // either be a simple string (which doesn't need it by definition) or 
  // a pattern which has already been resolved in Pattern, or FTLNone.
  return value.toString();
}

export function format(ctx, lang, args, entity) {
  if (typeof entity === 'string') {
    return [entity, []];
  }

  return resolve(toString(entity)).run({
    ctx, lang, args, dirty: new WeakSet()
  });
}
