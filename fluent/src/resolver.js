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
 * All functions in this file pass around a special object called `scope`.
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
function getDefault(scope, variants, star) {
  if (variants[star]) {
    return Type(scope, variants[star].value);
  }

  scope.errors.push(new RangeError("No default"));
  return new FluentNone();
}

// Helper: resolve arguments to a call expression.
function getArguments(scope, args) {
  const positional = [];
  const named = {};

  for (const arg of args) {
    if (arg.type === "narg") {
      named[arg.name] = Type(scope, arg.value);
    } else {
      positional.push(Type(scope, arg));
    }
  }

  return [positional, named];
}

// Resolve an expression to a Fluent type.
export default function Type(scope, expr) {
  // A fast-path for strings which are the most common case. Since they
  // natively have the `toString` method they can be used as if they were
  // a FluentType instance without incurring the cost of creating one.
  if (typeof expr === "string") {
    return scope.bundle._transform(expr);
  }

  // The Runtime AST (Entries) encodes patterns (complex strings with
  // placeables) as Arrays.
  if (Array.isArray(expr)) {
    return Pattern(scope, expr);
  }

  switch (expr.type) {
    case "str":
      return expr.value;
    case "num":
      return new FluentNumber(expr.value, {
        minimumFractionDigits: expr.precision,
      });
    case "var":
      return VariableReference(scope, expr);
    case "mesg":
      return MessageReference(scope, expr);
    case "term":
      return TermReference(scope, expr);
    case "func":
      return FunctionReference(scope, expr);
    case "select":
      return SelectExpression(scope, expr);
    default:
      return new FluentNone();
  }
}

// Resolve a reference to a variable.
function VariableReference(scope, {name}) {
  if (!scope.args || !scope.args.hasOwnProperty(name)) {
    if (scope.insideTermReference === false) {
      scope.errors.push(new ReferenceError(`Unknown variable: ${name}`));
    }
    return new FluentNone(`$${name}`);
  }

  const arg = scope.args[name];

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
      scope.errors.push(
        new TypeError(`Unsupported variable type: ${name}, ${typeof arg}`)
      );
      return new FluentNone(`$${name}`);
  }
}

// Resolve a reference to another message.
function MessageReference(scope, {name, attr}) {
  const message = scope.bundle._messages.get(name);
  if (!message) {
    const err = new ReferenceError(`Unknown message: ${name}`);
    scope.errors.push(err);
    return new FluentNone(name);
  }

  if (attr) {
    const attribute = message.attributes[attr];
    if (attribute) {
      return Type(scope, attribute);
    }
    scope.errors.push(new ReferenceError(`Unknown attribute: ${attr}`));
    return new FluentNone(`${name}.${attr}`);
  } else if (message.value) {
    return Type(scope, message.value);
  } else {
    scope.errors.push(new ReferenceError(`No value: ${name}`));
    return new FluentNone(name);
  }
}

// Resolve a call to a Term with key-value arguments.
function TermReference(scope, {name, attr, args}) {
  const id = `-${name}`;
  const term = scope.bundle._terms.get(id);
  if (!term) {
    const err = new ReferenceError(`Unknown term: ${id}`);
    scope.errors.push(err);
    return new FluentNone(id);
  }

  // Every TermReference has its own args.
  const [, keyargs] = getArguments(scope, args);
  const local = {...scope, args: keyargs, insideTermReference: true};

  if (attr) {
    const attribute = term.attributes[attr];
    if (attribute) {
      return Type(local, attribute);
    }
    scope.errors.push(new ReferenceError(`Unknown attribute: ${attr}`));
    return new FluentNone(`${name}.${attr}`);
  } else {
    return Type(local, term.value);
  }
}

// Resolve a call to a Function with positional and key-value arguments.
function FunctionReference(scope, {name, args}) {
  // Some functions are built-in. Others may be provided by the runtime via
  // the `FluentBundle` constructor.
  const func = scope.bundle._functions[name] || builtins[name];
  if (!func) {
    scope.errors.push(new ReferenceError(`Unknown function: ${name}()`));
    return new FluentNone(`${name}()`);
  }

  if (typeof func !== "function") {
    scope.errors.push(new TypeError(`Function ${name}() is not callable`));
    return new FluentNone(`${name}()`);
  }

  try {
    return func(...getArguments(scope, args));
  } catch (e) {
    // XXX Report errors.
    return new FluentNone();
  }
}

// Resolve a select expression to the member object.
function SelectExpression(scope, {selector, variants, star}) {
  let sel = Type(scope, selector);
  if (sel instanceof FluentNone) {
    return getDefault(scope, variants, star);
  }

  // Match the selector against keys of each variant, in order.
  for (const variant of variants) {
    const key = Type(scope, variant.key);
    if (match(scope.bundle, sel, key)) {
      return Type(scope, variant.value);
    }
  }

  return getDefault(scope, variants, star);
}

// Resolve a pattern (a complex string with placeables).
function Pattern(scope, ptn) {
  if (scope.dirty.has(ptn)) {
    scope.errors.push(new RangeError("Cyclic reference"));
    return new FluentNone();
  }

  // Tag the pattern as dirty for the purpose of the current resolution.
  scope.dirty.add(ptn);
  const result = [];

  // Wrap interpolations with Directional Isolate Formatting characters
  // only when the pattern has more than one element.
  const useIsolating = scope.bundle._useIsolating && ptn.length > 1;

  for (const elem of ptn) {
    if (typeof elem === "string") {
      result.push(scope.bundle._transform(elem));
      continue;
    }

    const part = Type(scope, elem).toString(scope);

    if (useIsolating) {
      result.push(FSI);
    }

    if (part.length > MAX_PLACEABLE_LENGTH) {
      scope.errors.push(
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

  scope.dirty.delete(ptn);
  return result.join("");
}
