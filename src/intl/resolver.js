/**
 * @module
 *
 * The role of the FTL resolver is to format a translation object to an
 * instance of `FTLType`.
 *
 * Translations can contain references to other entities or external arguments,
 * conditional logic in form of select expressions, traits which describe their
 * grammatical features, and can use FTL builtins which make use of the `Intl`
 * formatters to format numbers, dates, lists and more into the context's
 * language.  See the documentation of the FTL syntax for more information.
 *
 * In case of errors the resolver will try to salvage as much of the
 * translation as possible.  In rare situations where the resolver didn't know
 * how to recover from an error it will return an instance of `FTLNone`.
 *
 * `EntityReference`, `MemberExpression` and `SelectExpression` resolve to raw
 * Runtime Entries objects and the result of the resolution needs to be passed
 * into `Value` to get their real value.  This is useful for composing
 * expressions.  Consider:
 *
 *     brand-name[nominative]
 *
 * which is a `MemberExpression` with properties `obj: EntityReference` and
 * `key: Keyword`.  If `EntityReference` was resolved eagerly, it would
 * instantly resolve to the value of the `brand-name` entity.  Instead, we want
 * to get the entity object and look for its `nominative` trait.
 *
 * All other expressions (except for `FunctionReference` which is only used in
 * `CallExpression`) resolve to an instance of `FTLType`, which must then be
 * sringified with its `toString` method by the caller.
 */

import { resolve, ask, tell } from './environment';
import { FTLType, FTLNone, FTLNumber, FTLDateTime, FTLKeyword, FTLList }
  from './types';
import builtins from './builtins';

// Unicode bidi isolation characters.
const FSI = '\u2068';
const PDI = '\u2069';

// Prevent expansion of too long placeables.
const MAX_PLACEABLE_LENGTH = 2500;

/**
 * Map an array of JavaScript values into FTL Values.
 *
 * Used for external arguments of Array type and for implicit Lists in
 * placeables.
 *
 * @private
 */
function* mapValues(arr) {
  const values = new FTLList();
  for (const elem of arr) {
    values.push(yield* Value(elem));
  }
  return values;
}

/**
 * Helper for choosing the default value from a set of members.
 *
 * Used in SelectExpressions and Entity.
 *
 * @private
 */
function* DefaultMember(members, def) {
  if (members[def]) {
    return members[def];
  }

  yield tell(new RangeError('No default'));
  return new FTLNone();
}


/**
 * Resolve a reference to an entity to the entity object.
 *
 * @private
 */
function* EntityReference({name}) {
  const { ctx } = yield ask();
  const entity = ctx.messages.get(name);

  if (!entity) {
    yield tell(new ReferenceError(`Unknown entity: ${name}`));
    return new FTLNone(name);
  }

  return entity;
}

/**
 * Resolve a member expression to the member object.
 *
 * @private
 */
function* MemberExpression({obj, key}) {
  const entity = yield* EntityReference(obj);
  if (entity instanceof FTLNone) {
    return entity;
  }

  const { ctx } = yield ask();
  const keyword = yield* Value(key);

  // Match the specified key against keys of each trait, in order.
  for (const member of entity.traits) {
    const memberKey = yield* Value(member.key);
    if (keyword.match(ctx, memberKey)) {
      return member;
    }
  }

  yield tell(new ReferenceError(`Unknown trait: ${keyword.toString(ctx)}`));
  return yield* Entity(entity);
}

/**
 * Resolve a select expression to the member object.
 *
 * @private
 */
function* SelectExpression({exp, vars, def}) {
  const selector = yield* Value(exp);
  if (selector instanceof FTLNone) {
    return yield* DefaultMember(vars, def);
  }

  // Match the selector against keys of each variant, in order.
  for (const variant of vars) {
    const key = yield* Value(variant.key);

    // XXX A special case of numbers to avoid code repetition in types.js.
    if (key instanceof FTLNumber &&
        selector instanceof FTLNumber &&
        key.valueOf() === selector.valueOf()) {
      return variant;
    }

    const { ctx } = yield ask();

    if (key instanceof FTLKeyword && key.match(ctx, selector)) {
      return variant;
    }
  }

  return yield* DefaultMember(vars, def);
}


/**
 * Resolve expression to an FTL type.
 *
 * JavaScript strings are a special case.  Since they natively have the
 * `toString` method they can be used as if they were an FTL type without
 * paying the cost of creating a instance of one.
 *
 * @param   {Object} expr
 * @returns {FTLType}
 * @private
 */
function* Value(expr) {
  // A fast-path for strings which are the most common case, and for `FTLNone`
  // which doesn't require any additional logic.
  if (typeof expr === 'string' || expr instanceof FTLNone) {
    return expr;
  }

  // The Runtime AST (Entries) encodes patterns (complex strings with
  // placeables) as Arrays.
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
    case 'ref': {
      const entity = yield* EntityReference(expr);
      return yield* Value(entity);
    }
    case 'mem': {
      const member = yield* MemberExpression(expr);
      return yield* Value(member.val);
    }
    case 'sel': {
      const member = yield* SelectExpression(expr);
      return yield* Value(member.val);
    }
    default:
      return yield* Entity(expr);
  }
}

/**
 * Resolve a reference to an external argument.
 *
 * @private
 */
function* ExternalArgument({name}) {
  const { args } = yield ask();

  if (!args || !args.hasOwnProperty(name)) {
    yield tell(new ReferenceError(`Unknown external: ${name}`));
    return new FTLNone(name);
  }

  const arg = args[name];

  if (arg instanceof FTLType) {
    return arg;
  }

  // Convert the argument to an FTL type.
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

/**
 * Resolve a reference to a function.
 *
 * @private
 */
function* FunctionReference({name}) {
  // Some functions are built-in.  Others may be provided by the runtime via
  // the `MessageContext` constructor.
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

/**
 * Resolve a call to a Function with positional and key-value arguments.
 *
 * @private
 */
function* CallExpression({name, args}) {
  const callee = yield* FunctionReference(name);

  if (callee instanceof FTLNone) {
    return callee;
  }

  const posargs = [];
  const keyargs = [];

  for (const arg of args) {
    if (arg.type === 'kv') {
      keyargs[arg.name] = yield* Value(arg.val);
    } else {
      posargs.push(yield* Value(arg));
    }
  }

  // XXX functions should also report errors
  return callee(posargs, keyargs);
}

/**
 * Resolve a pattern (a complex string with placeables).
 *
 * @private
 */
function* Pattern(ptn) {
  const { ctx, dirty } = yield ask();

  if (dirty.has(ptn)) {
    yield tell(new RangeError('Cyclic reference'));
    return new FTLNone();
  }

  // Tag the pattern as dirty for the purpose of the current resolution.
  dirty.add(ptn);
  let result = '';

  for (const part of ptn) {
    if (typeof part === 'string') {
      result += part;
    } else {
      // Optimize the most common case: the placeable only has one expression.
      // Otherwise map its expressions to Values.
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

/**
 * Resolve an Entity.
 *
 * @private
 */
function* Entity(entity) {
  if (entity.val !== undefined) {
    return yield* Value(entity.val);
  }

  const def = yield* DefaultMember(entity.traits, entity.def);
  return yield* Value(def);
}

/**
 * Format a translation into an `FTLType`.
 *
 * The return value must be sringified with its `toString` method by the
 * caller.
 *
 * @param   {MessageContext} ctx
 * @param   {Object}         args
 * @param   {Object}         entity
 * @param   {Array}          errors
 * @returns {FTLType}
 */
export function format(ctx, args, entity, errors = []) {
  return resolve(Entity(entity)).run({
    ctx, args, log: errors, dirty: new WeakSet()
  });
}
