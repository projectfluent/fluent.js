import { resolve, ask, tell } from './readwrite';
import { FTLBase, FTLNone, FTLNumber, FTLDateTime, FTLKeyword, FTLList }
  from './types';
import builtins from './builtins';

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
function* DefaultMember(members, allowNoDefault = false) {
  for (let member of members) {
    if (member.def) {
      return member;
    }
  }

  if (!allowNoDefault) {
    yield tell(new RangeError('No default'));
  }

  return { val: new FTLNone() };
}


// Half-resolved expressions evaluate to raw Runtime AST nodes

function* EntityReference({name}) {
  const { ctx } = yield ask();
  const entity = ctx.messages.get(name);

  if (!entity) {
    yield tell(new ReferenceError(`Unknown entity: ${name}`));
    return new FTLNone(name);
  }

  return entity;
}

function* MemberExpression({obj, key}) {
  const entity = yield* EntityReference(obj);
  if (entity instanceof FTLNone) {
    return { val: entity };
  }

  const { ctx } = yield ask();
  const keyword = yield* Value(key);

  for (let member of entity.traits) {
    const memberKey = yield* Value(member.key);
    if (keyword.match(ctx, memberKey)) {
      return member;
    }
  }

  yield tell(new ReferenceError(`Unknown trait: ${keyword.toString(ctx)}`));
  return {
    val: yield* Entity(entity)
  };
}

function* SelectExpression({exp, vars}) {
  const selector = yield* Value(exp);
  if (selector instanceof FTLNone) {
    return yield* DefaultMember(vars);
  }

  for (let variant of vars) {
    const key = yield* Value(variant.key);

    if (key instanceof FTLNumber &&
        selector instanceof FTLNumber &&
        key.valueOf() === selector.valueOf()) {
      return variant;
    }

    const { ctx } = yield ask();

    if (key instanceof FTLKeyword &&
        key.match(ctx, selector)) {
      return variant;
    }
  }

  return yield* DefaultMember(vars);
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
    case 'fun':
      return yield* FunctionReference(expr);
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

function* ExternalArgument({name}) {
  const { args } = yield ask();

  if (!args || !args.hasOwnProperty(name)) {
    yield tell(new ReferenceError(`Unknown external: ${name}`));
    return new FTLNone(name);
  }

  const arg = args[name];

  if (arg instanceof FTLBase) {
    return arg;
  }

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
      yield tell(
        new TypeError(`Unsupported external type: ${name}, ${typeof arg}`)
      );
      return new FTLNone(name);
  }
}

function* FunctionReference({name}) {
  const { ctx: { functions } } = yield ask();
  const func = functions[name] || builtins[name];

  if (!func) {
    yield tell(new ReferenceError(`Unknown built-in: ${name}()`));
    return new FTLNone(`${name}()`);
  }

  if (typeof func !== 'function') {
    yield tell(new TypeError(`Function ${name}() is not callable`));
    return new FTLNone(`${name}()`);
  }

  return func;
}

function* CallExpression({name, args}) {
  const callee = yield* FunctionReference(name);

  if (callee instanceof FTLNone) {
    return callee;
  }

  const posargs = [];
  const keyargs = [];

  for (let arg of args) {
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
  const { ctx, dirty } = yield ask();

  if (dirty.has(ptn)) {
    yield tell(new RangeError('Cyclic reference'));
    return new FTLNone();
  }

  dirty.add(ptn);
  let result = '';

  for (let part of ptn) {
    if (typeof part === 'string') {
      result += part;
    } else {
      const value = part.length === 1 ?
        yield* Value(part[0]) : yield* mapValues(part);

      const str = value.toString(ctx);
      if (str.length > MAX_PLACEABLE_LENGTH) {
        yield tell(
          new RangeError(
            'Too many characters in placeable ' +
            `(${str.length}, max allowed is ${MAX_PLACEABLE_LENGTH})`
          )
        );
        result += FSI + str.substr(0, MAX_PLACEABLE_LENGTH) + PDI;
      } else {
        result += FSI + str + PDI;
      }
    }
  }

  dirty.delete(ptn);
  return result;
}

function* Entity(entity, allowNoDefault = false) {
  if (entity.val !== undefined) {
    return yield* Value(entity.val);
  }

  if (!entity.traits) {
    return yield* Value(entity);
  }

  const def = yield* DefaultMember(entity.traits, allowNoDefault);
  return yield* Value(def);
}

// evaluate `entity` to an FTL Value type: string or FTLNone
function* toFTLType(entity, opts) {
  if (entity === undefined) {
    return new FTLNone();
  }

  return yield* Entity(entity, opts.allowNoDefault);
}

const _opts = {
  allowNoDefault: false
};

export function format(ctx, args, entity, opts = _opts) {
  // optimization: many translations are simple strings and we can very easily
  // avoid the cost of a proper resolution by having this shortcut here
  if (typeof entity === 'string') {
    return [entity, []];
  }

  return resolve(toFTLType(entity, opts)).run({
    ctx, args, dirty: new WeakSet()
  });
}
