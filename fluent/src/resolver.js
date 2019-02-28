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
 * All expressions resolve to an instance of `FluentType`. The caller should
 * use the `toString` method to convert the instance to a native value.
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


// Helper: match a variant key to the given selector.
function match(bundle, selector, key) {
  if (key === selector) {
    // Both are strings.
    return true;
  }

  // XXX Consider comparing options too, e.g. minimumFractionDigits.
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

// Helper: resolve the default variant from a list of variants.
function getDefault(env, variants, star) {
  if (variants[star]) {
    return Type(env, variants[star]);
  }

  const { errors } = env;
  errors.push(new RangeError("No default"));
  return new FluentNone();
}

// Helper: resolve arguments to a call expression.
function getArguments(env, args) {
  const positional = [];
  const named = {};

  for (const arg of args) {
    if (arg.type === "narg") {
      named[arg.name] = Type(env, arg.value);
    } else {
      positional.push(Type(env, arg));
    }
  }

  return [positional, named];
}

// Resolve an expression to a Fluent type.
function Type(env, expr) {
  // A fast-path for strings which are the most common case. Since they
  // natively have the `toString` method they can be used as if they were
  // a FluentType instance without incurring the cost of creating one.
  if (typeof expr === "string") {
    return env.bundle._transform(expr);
  }

  // A fast-path for `FluentNone` which doesn't require any additional logic.
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
      return new FluentNumber(expr.value, {
        minimumFractionDigits: expr.precision,
      });
    case "var":
      return VariableReference(env, expr);
    case "mesg":
      return MessageReference(env, expr);
    case "term":
      return TermReference(env, expr);
    case "func":
      return FunctionReference(env, expr);
    case "select":
      return SelectExpression(env, expr);
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

// Resolve a reference to a variable.
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

// Resolve a reference to another message.
function MessageReference(env, {name, attr}) {
  const {bundle, errors} = env;
  const message = bundle._messages.get(name);
  if (!message) {
    const err = new ReferenceError(`Unknown message: ${name}`);
    errors.push(err);
    return new FluentNone(name);
  }

  if (attr) {
    const attribute = message.attrs && message.attrs[attr];
    if (attribute) {
      return Type(env, attribute);
    }
    errors.push(new ReferenceError(`Unknown attribute: ${attr}`));
    return Type(env, message);
  }

  return Type(env, message);
}

// Resolve a call to a Term with key-value arguments.
function TermReference(env, {name, attr, args}) {
  const {bundle, errors} = env;

  const id = `-${name}`;
  const term = bundle._terms.get(id);
  if (!term) {
    const err = new ReferenceError(`Unknown term: ${id}`);
    errors.push(err);
    return new FluentNone(id);
  }

  // Every TermReference has its own args.
  const [, keyargs] = getArguments(env, args);
  const local = {...env, args: keyargs};

  if (attr) {
    const attribute = term.attrs && term.attrs[attr];
    if (attribute) {
      return Type(local, attribute);
    }
    errors.push(new ReferenceError(`Unknown attribute: ${attr}`));
    return Type(local, term);
  }

  return Type(local, term);
}

// Resolve a call to a Function with positional and key-value arguments.
function FunctionReference(env, {name, args}) {
  // Some functions are built-in. Others may be provided by the runtime via
  // the `FluentBundle` constructor.
  const {bundle: {_functions}, errors} = env;
  const func = _functions[name] || builtins[name];

  if (!func) {
    errors.push(new ReferenceError(`Unknown function: ${name}()`));
    return new FluentNone(`${name}()`);
  }

  if (typeof func !== "function") {
    errors.push(new TypeError(`Function ${name}() is not callable`));
    return new FluentNone(`${name}()`);
  }

  try {
    return func(...getArguments(env, args));
  } catch (e) {
    // XXX Report errors.
    return new FluentNone();
  }
}

// Resolve a select expression to the member object.
function SelectExpression(env, {selector, variants, star}) {
  let sel = Type(env, selector);
  if (sel instanceof FluentNone) {
    const variant = getDefault(env, variants, star);
    return Type(env, variant);
  }

  // Match the selector against keys of each variant, in order.
  for (const variant of variants) {
    const key = Type(env, variant.key);
    if (match(env.bundle, sel, key)) {
      return Type(env, variant);
    }
  }

  const variant = getDefault(env, variants, star);
  return Type(env, variant);
}

// Resolve a pattern (a complex string with placeables).
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
