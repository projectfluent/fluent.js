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

import { FTLType, FTLNone, FTLNumber, FTLDateTime, FTLKeyword, FTLList }
  from './types';
import builtins from './builtins';

// Prevent expansion of too long placeables.
const MAX_PLACEABLE_LENGTH = 2500;

// Unicode bidi isolation characters.
const FSI = '\u2068';
const PDI = '\u2069';


/**
 * Map an array of JavaScript values into FTL Values.
 *
 * Used for external arguments of Array type and for implicit Lists in
 * placeables.
 *
 * @private
 */
function mapValues(env, arr) {
  const values = new FTLList();
  for (const elem of arr) {
    values.push(Value(env, elem));
  }
  return values;
}

/**
 * Helper for choosing the default value from a set of members.
 *
 * Used in SelectExpressions and Value.
 *
 * @private
 */
function DefaultMember(env, members, def) {
  if (members[def]) {
    return members[def];
  }

  const { errors } = env;
  errors.push(new RangeError('No default'));
  return new FTLNone();
}


/**
 * Resolve a reference to an entity to the entity object.
 *
 * @private
 */
function EntityReference(env, {name}) {
  const { ctx, errors } = env;
  const entity = ctx.messages.get(name);

  if (!entity) {
    errors.push(new ReferenceError(`Unknown entity: ${name}`));
    return new FTLNone(name);
  }

  return entity;
}

/**
 * Resolve a member expression to the member object.
 *
 * @private
 */
function MemberExpression(env, {obj, key}) {
  const entity = EntityReference(env, obj);
  if (entity instanceof FTLNone) {
    return entity;
  }

  const { ctx, errors } = env;
  const keyword = Value(env, key);

  if (entity.traits) {
    // Match the specified key against keys of each trait, in order.
    for (const member of entity.traits) {
      const memberKey = Value(env, member.key);
      if (keyword.match(ctx, memberKey)) {
        return member;
      }
    }
  }

  errors.push(new ReferenceError(`Unknown trait: ${keyword.toString(ctx)}`));
  return Value(env, entity);
}

/**
 * Resolve a select expression to the member object.
 *
 * @private
 */
function SelectExpression(env, {exp, vars, def}) {
  const selector = Value(env, exp);
  if (selector instanceof FTLNone) {
    return DefaultMember(env, vars, def);
  }

  // Match the selector against keys of each variant, in order.
  for (const variant of vars) {
    const key = Value(env, variant.key);

    // XXX A special case of numbers to avoid code repetition in types.js.
    if (key instanceof FTLNumber &&
        selector instanceof FTLNumber &&
        key.valueOf() === selector.valueOf()) {
      return variant;
    }

    const { ctx } = env;

    if (key instanceof FTLKeyword && key.match(ctx, selector)) {
      return variant;
    }
  }

  return DefaultMember(env, vars, def);
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
function Value(env, expr) {
  // A fast-path for strings which are the most common case, and for `FTLNone`
  // which doesn't require any additional logic.
  if (typeof expr === 'string' || expr instanceof FTLNone) {
    return expr;
  }

  // The Runtime AST (Entries) encodes patterns (complex strings with
  // placeables) as Arrays.
  if (Array.isArray(expr)) {
    return Pattern(env, expr);
  }


  switch (expr.type) {
    case 'kw':
      return new FTLKeyword(expr);
    case 'num':
      return new FTLNumber(expr.val);
    case 'ext':
      return ExternalArgument(env, expr);
    case 'fun':
      return FunctionReference(env, expr);
    case 'call':
      return CallExpression(env, expr);
    case 'ref': {
      const entity = EntityReference(env, expr);
      return Value(env, entity);
    }
    case 'mem': {
      const member = MemberExpression(env, expr);
      return Value(env, member);
    }
    case 'sel': {
      const member = SelectExpression(env, expr);
      return Value(env, member);
    }
    case undefined: {
      // If it's a node with a value, resolve the value.
      if (expr.val !== undefined) {
        return Value(env, expr.val);
      }

      const def = DefaultMember(env, expr.traits, expr.def);
      return Value(env, def);
    }
    default:
      return new FTLNone();
  }
}

/**
 * Resolve a reference to an external argument.
 *
 * @private
 */
function ExternalArgument(env, {name}) {
  const { args, errors } = env;

  if (!args || !args.hasOwnProperty(name)) {
    errors.push(new ReferenceError(`Unknown external: ${name}`));
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
        return mapValues(env, arg);
      }
      if (arg instanceof Date) {
        return new FTLDateTime(arg);
      }
    default:
      errors.push(
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
function FunctionReference(env, {name}) {
  // Some functions are built-in.  Others may be provided by the runtime via
  // the `MessageContext` constructor.
  const { ctx: { functions }, errors } = env;
  const func = functions[name] || builtins[name];

  if (!func) {
    errors.push(new ReferenceError(`Unknown function: ${name}()`));
    return new FTLNone(`${name}()`);
  }

  if (typeof func !== 'function') {
    errors.push(new TypeError(`Function ${name}() is not callable`));
    return new FTLNone(`${name}()`);
  }

  return func;
}

/**
 * Resolve a call to a Function with positional and key-value arguments.
 *
 * @private
 */
function CallExpression(env, {name, args}) {
  const callee = FunctionReference(env, name);

  if (callee instanceof FTLNone) {
    return callee;
  }

  const posargs = [];
  const keyargs = [];

  for (const arg of args) {
    if (arg.type === 'kv') {
      keyargs[arg.name] = Value(env, arg.val);
    } else {
      posargs.push(Value(env, arg));
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
function Pattern(env, ptn) {
  const { ctx, dirty, errors } = env;

  if (dirty.has(ptn)) {
    errors.push(new RangeError('Cyclic reference'));
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
        Value(env, part[0]) : mapValues(env, part);

      let str = value.toString(ctx);

      if (str.length > MAX_PLACEABLE_LENGTH) {
        errors.push(
          new RangeError(
            'Too many characters in placeable ' +
            `(${str.length}, max allowed is ${MAX_PLACEABLE_LENGTH})`
          )
        );
        str = str.substr(0, MAX_PLACEABLE_LENGTH);
      }

      if (ctx.useIsolating) {
        result += `${FSI}${str}${PDI}`;
      } else {
        result += str;
      }
    }
  }

  dirty.delete(ptn);
  return result;
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
export default function resolve(ctx, args, entity, errors = []) {
  const env = {
    ctx, args, errors, dirty: new WeakSet()
  };
  return Value(env, entity);
}
