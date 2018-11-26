/* global Intl */

/**
 * @overview
 *
 * The role of the Fluent resolver is to format a translation object to an
 * instance of `FluentType` or an array of instances.
 *
 * Translations can contain references to other messages or variables,
 * conditional logic in form of select expressions, traits which describe their
 * grammatical features, and can use Fluent builtins which make use of the
 * `Intl` formatters to format numbers, dates, lists and more into the
 * bundle's language. See the documentation of the Fluent syntax for more
 * information.
 *
 * In case of errors the resolver will try to salvage as much of the
 * translation as possible.  In rare situations where the resolver didn't know
 * how to recover from an error it will return an instance of `FluentNone`.
 *
 * `MessageReference`, `VariantExpression`, `AttributeExpression` and
 * `SelectExpression` resolve to raw Runtime Entries objects and the result of
 * the resolution needs to be passed into `Type` to get their real value.
 * This is useful for composing expressions.  Consider:
 *
 *     brand-name[nominative]
 *
 * which is a `VariantExpression` with properties `id: MessageReference` and
 * `key: Keyword`.  If `MessageReference` was resolved eagerly, it would
 * instantly resolve to the value of the `brand-name` message.  Instead, we
 * want to get the message object and look for its `nominative` variant.
 *
 * All other expressions (except for `FunctionReference` which is only used in
 * `CallExpression`) resolve to an instance of `FluentType`.  The caller should
 * use the `toString` method to convert the instance to a native value.
 *
 *
 * All functions in this file pass around a special object called `env`.
 * This object stores a set of elements used by all resolve functions:
 *
 *  * {FluentBundle} bundle
 *      bundle for which the given resolution is happening
 *  * {Object} args
 *      list of developer provided arguments that can be used
 *  * {Array} errors
 *      list of errors collected while resolving
 *  * {WeakSet} dirty
 *      Set of patterns already encountered during this resolution.
 *      This is used to prevent cyclic resolutions.
 */


import { FluentType, FluentNone, FluentNumber, FluentDateTime }
  from "./types.js";
import builtins from "./builtins.js";

// Prevent expansion of too long placeables.
const MAX_PLACEABLE_LENGTH = 2500;

// Unicode bidi isolation characters.
const FSI = "\u2068";
const PDI = "\u2069";


/**
 * Helper for matching a variant key to the given selector.
 *
 * Used in SelectExpressions and VariantExpressions.
 *
 * @param   {FluentBundle} bundle
 *    Resolver environment object.
 * @param   {FluentType} key
 *    The key of the currently considered variant.
 * @param   {FluentType} selector
 *    The selector based om which the correct variant should be chosen.
 * @returns {FluentType}
 * @private
 */
function match(bundle, selector, key) {
  if (key === selector) {
    // Both are strings.
    return true;
  }

  if (key instanceof FluentNumber
    && selector instanceof FluentNumber
    && key.value === selector.value) {
    return true;
  }

  if (selector instanceof FluentNumber && typeof key === "string") {
    let category = bundle
      ._memoizeIntlObject(Intl.PluralRules, selector.opts)
      .select(selector.value);
    if (key === category) {
      return true;
    }
  }

  return false;
}

/**
 * Helper for choosing the default value from a set of members.
 *
 * Used in SelectExpressions and Type.
 *
 * @param   {Object} env
 *    Resolver environment object.
 * @param   {Object} members
 *    Hash map of variants from which the default value is to be selected.
 * @param   {Number} star
 *    The index of the default variant.
 * @returns {FluentType}
 * @private
 */
function DefaultMember(env, members, star) {
  if (members[star]) {
    return members[star];
  }

  const { errors } = env;
  errors.push(new RangeError("No default"));
  return new FluentNone();
}


/**
 * Resolve a reference to another message.
 *
 * @param   {Object} env
 *    Resolver environment object.
 * @param   {Object} id
 *    The identifier of the message to be resolved.
 * @param   {String} id.name
 *    The name of the identifier.
 * @returns {FluentType}
 * @private
 */
function MessageReference(env, {name}) {
  const { bundle, errors } = env;
  const message = name.startsWith("-")
    ? bundle._terms.get(name)
    : bundle._messages.get(name);

  if (!message) {
    const err = name.startsWith("-")
      ? new ReferenceError(`Unknown term: ${name}`)
      : new ReferenceError(`Unknown message: ${name}`);
    errors.push(err);
    return new FluentNone(name);
  }

  return message;
}

/**
 * Resolve a variant expression to the variant object.
 *
 * @param   {Object} env
 *    Resolver environment object.
 * @param   {Object} expr
 *    An expression to be resolved.
 * @param   {Object} expr.ref
 *    An Identifier of a message for which the variant is resolved.
 * @param   {Object} expr.id.name
 *    Name a message for which the variant is resolved.
 * @param   {Object} expr.key
 *    Variant key to be resolved.
 * @returns {FluentType}
 * @private
 */
function VariantExpression(env, {ref, selector}) {
  const message = MessageReference(env, ref);
  if (message instanceof FluentNone) {
    return message;
  }

  const { bundle, errors } = env;
  const sel = Type(env, selector);
  const value = message.value || message;

  function isVariantList(node) {
    return Array.isArray(node) &&
      node[0].type === "select" &&
      node[0].selector === null;
  }

  if (isVariantList(value)) {
    // Match the specified key against keys of each variant, in order.
    for (const variant of value[0].variants) {
      const key = Type(env, variant.key);
      if (match(env.bundle, sel, key)) {
        return variant;
      }
    }
  }

  errors.push(
    new ReferenceError(`Unknown variant: ${sel.toString(bundle)}`));
  return Type(env, message);
}


/**
 * Resolve an attribute expression to the attribute object.
 *
 * @param   {Object} env
 *    Resolver environment object.
 * @param   {Object} expr
 *    An expression to be resolved.
 * @param   {String} expr.ref
 *    An ID of a message for which the attribute is resolved.
 * @param   {String} expr.name
 *    Name of the attribute to be resolved.
 * @returns {FluentType}
 * @private
 */
function AttributeExpression(env, {ref, name}) {
  const message = MessageReference(env, ref);
  if (message instanceof FluentNone) {
    return message;
  }

  if (message.attrs) {
    // Match the specified name against keys of each attribute.
    for (const attrName in message.attrs) {
      if (name === attrName) {
        return message.attrs[name];
      }
    }
  }

  const { errors } = env;
  errors.push(new ReferenceError(`Unknown attribute: ${name}`));
  return Type(env, message);
}

/**
 * Resolve a select expression to the member object.
 *
 * @param   {Object} env
 *    Resolver environment object.
 * @param   {Object} expr
 *    An expression to be resolved.
 * @param   {String} expr.selector
 *    Selector expression
 * @param   {Array} expr.variants
 *    List of variants for the select expression.
 * @param   {Number} expr.star
 *    Index of the default variant.
 * @returns {FluentType}
 * @private
 */
function SelectExpression(env, {selector, variants, star}) {
  if (selector === null) {
    return DefaultMember(env, variants, star);
  }

  let sel = Type(env, selector);
  if (sel instanceof FluentNone) {
    return DefaultMember(env, variants, star);
  }

  // Match the selector against keys of each variant, in order.
  for (const variant of variants) {
    const key = Type(env, variant.key);
    if (match(env.bundle, sel, key)) {
      return variant;
    }
  }

  return DefaultMember(env, variants, star);
}


/**
 * Resolve expression to a Fluent type.
 *
 * JavaScript strings are a special case.  Since they natively have the
 * `toString` method they can be used as if they were a Fluent type without
 * paying the cost of creating a instance of one.
 *
 * @param   {Object} env
 *    Resolver environment object.
 * @param   {Object} expr
 *    An expression object to be resolved into a Fluent type.
 * @returns {FluentType}
 * @private
 */
function Type(env, expr) {
  // A fast-path for strings which are the most common case, and for
  // `FluentNone` which doesn't require any additional logic.
  if (typeof expr === "string") {
    return env.bundle._transform(expr);
  }
  if (expr instanceof FluentNone) {
    return expr;
  }

  // The Runtime AST (Entries) encodes patterns (complex strings with
  // placeables) as Arrays.
  if (Array.isArray(expr)) {
    return Pattern(env, expr);
  }


  switch (expr.type) {
    case "str":
      return expr.value;
    case "num":
      return new FluentNumber(expr.value);
    case "var":
      return VariableReference(env, expr);
    case "func":
      return FunctionReference(env, expr);
    case "call":
      return CallExpression(env, expr);
    case "ref": {
      const message = MessageReference(env, expr);
      return Type(env, message);
    }
    case "getattr": {
      const attr = AttributeExpression(env, expr);
      return Type(env, attr);
    }
    case "getvar": {
      const variant = VariantExpression(env, expr);
      return Type(env, variant);
    }
    case "select": {
      const member = SelectExpression(env, expr);
      return Type(env, member);
    }
    case undefined: {
      // If it's a node with a value, resolve the value.
      if (expr.value !== null && expr.value !== undefined) {
        return Type(env, expr.value);
      }

      const { errors } = env;
      errors.push(new RangeError("No value"));
      return new FluentNone();
    }
    default:
      return new FluentNone();
  }
}

/**
 * Resolve a reference to a variable.
 *
 * @param   {Object} env
 *    Resolver environment object.
 * @param   {Object} expr
 *    An expression to be resolved.
 * @param   {String} expr.name
 *    Name of an argument to be returned.
 * @returns {FluentType}
 * @private
 */
function VariableReference(env, {name}) {
  const { args, errors } = env;

  if (!args || !args.hasOwnProperty(name)) {
    errors.push(new ReferenceError(`Unknown variable: ${name}`));
    return new FluentNone(`$${name}`);
  }

  const arg = args[name];

  // Return early if the argument already is an instance of FluentType.
  if (arg instanceof FluentType) {
    return arg;
  }

  // Convert the argument to a Fluent type.
  switch (typeof arg) {
    case "string":
      return arg;
    case "number":
      return new FluentNumber(arg);
    case "object":
      if (arg instanceof Date) {
        return new FluentDateTime(arg);
      }
    default:
      errors.push(
        new TypeError(`Unsupported variable type: ${name}, ${typeof arg}`)
      );
      return new FluentNone(`$${name}`);
  }
}

/**
 * Resolve a reference to a function.
 *
 * @param   {Object}  env
 *    Resolver environment object.
 * @param   {Object} expr
 *    An expression to be resolved.
 * @param   {String} expr.name
 *    Name of the function to be returned.
 * @returns {Function}
 * @private
 */
function FunctionReference(env, {name}) {
  // Some functions are built-in.  Others may be provided by the runtime via
  // the `FluentBundle` constructor.
  const { bundle: { _functions }, errors } = env;
  const func = _functions[name] || builtins[name];

  if (!func) {
    errors.push(new ReferenceError(`Unknown function: ${name}()`));
    return new FluentNone(`${name}()`);
  }

  if (typeof func !== "function") {
    errors.push(new TypeError(`Function ${name}() is not callable`));
    return new FluentNone(`${name}()`);
  }

  return func;
}

/**
 * Resolve a call to a Function with positional and key-value arguments.
 *
 * @param   {Object} env
 *    Resolver environment object.
 * @param   {Object} expr
 *    An expression to be resolved.
 * @param   {Object} expr.callee
 *    FTL Function object.
 * @param   {Array} expr.args
 *    FTL Function argument list.
 * @returns {FluentType}
 * @private
 */
function CallExpression(env, {callee, args}) {
  const func = FunctionReference(env, callee);

  if (func instanceof FluentNone) {
    return func;
  }

  const posargs = [];
  const keyargs = {};

  for (const arg of args) {
    if (arg.type === "narg") {
      keyargs[arg.name] = Type(env, arg.value);
    } else {
      posargs.push(Type(env, arg));
    }
  }

  try {
    return func(posargs, keyargs);
  } catch (e) {
    // XXX Report errors.
    return new FluentNone();
  }
}

/**
 * Resolve a pattern (a complex string with placeables).
 *
 * @param   {Object} env
 *    Resolver environment object.
 * @param   {Array} ptn
 *    Array of pattern elements.
 * @returns {Array}
 * @private
 */
function Pattern(env, ptn) {
  const { bundle, dirty, errors } = env;

  if (dirty.has(ptn)) {
    errors.push(new RangeError("Cyclic reference"));
    return new FluentNone();
  }

  // Tag the pattern as dirty for the purpose of the current resolution.
  dirty.add(ptn);
  const result = [];

  // Wrap interpolations with Directional Isolate Formatting characters
  // only when the pattern has more than one element.
  const useIsolating = bundle._useIsolating && ptn.length > 1;

  for (const elem of ptn) {
    if (typeof elem === "string") {
      result.push(bundle._transform(elem));
      continue;
    }

    const part = Type(env, elem).toString(bundle);

    if (useIsolating) {
      result.push(FSI);
    }

    if (part.length > MAX_PLACEABLE_LENGTH) {
      errors.push(
        new RangeError(
          "Too many characters in placeable " +
          `(${part.length}, max allowed is ${MAX_PLACEABLE_LENGTH})`
        )
      );
      result.push(part.slice(MAX_PLACEABLE_LENGTH));
    } else {
      result.push(part);
    }

    if (useIsolating) {
      result.push(PDI);
    }
  }

  dirty.delete(ptn);
  return result.join("");
}

/**
 * Format a translation into a string.
 *
 * @param   {FluentBundle} bundle
 *    A FluentBundle instance which will be used to resolve the
 *    contextual information of the message.
 * @param   {Object}         args
 *    List of arguments provided by the developer which can be accessed
 *    from the message.
 * @param   {Object}         message
 *    An object with the Message to be resolved.
 * @param   {Array}          errors
 *    An error array that any encountered errors will be appended to.
 * @returns {FluentType}
 */
export default function resolve(bundle, args, message, errors = []) {
  const env = {
    bundle, args, errors, dirty: new WeakSet()
  };
  return Type(env, message).toString(bundle);
}
