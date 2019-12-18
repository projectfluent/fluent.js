/* global Intl */

/**
 * @overview
 *
 * The role of the Fluent resolver is to format a `Pattern` to an instance of
 * `FluentType`. For performance reasons, primitive strings are considered such
 * instances, too.
 *
 * Translations can contain references to other messages or variables,
 * conditional logic in form of select expressions, traits which describe their
 * grammatical features, and can use Fluent builtins which make use of the
 * `Intl` formatters to format numbers and dates into the bundle's languages.
 * See the documentation of the Fluent syntax for more information.
 *
 * In case of errors the resolver will try to salvage as much of the
 * translation as possible. In rare situations where the resolver didn't know
 * how to recover from an error it will return an instance of `FluentNone`.
 *
 * All expressions resolve to an instance of `FluentType`. The caller should
 * use the `toString` method to convert the instance to a native value.
 *
 * Functions in this file pass around an instance of the `Scope` class, which
 * stores the data required for successful resolution and error recovery.
 */


import { FluentType, FluentNone, FluentNumber, FluentDateTime }
  from "./types.js";
import * as builtins from "./builtins.js";

// The maximum number of placeables which can be expanded in a single call to
// `formatPattern`. The limit protects against the Billion Laughs and Quadratic
// Blowup attacks. See https://msdn.microsoft.com/en-us/magazine/ee335713.aspx.
const MAX_PLACEABLES = 100;

// Unicode bidi isolation characters.
const FSI = "\u2068";
const PDI = "\u2069";


// Helper: match a variant key to the given selector.
function match(scope, selector, key) {
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
    let category = scope
      .memoizeIntlObject(Intl.PluralRules, selector.opts)
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
    return resolvePattern(scope, variants[star].value);
  }

  scope.reportError(new RangeError("No default"));
  return new FluentNone();
}

// Helper: resolve arguments to a call expression.
function getArguments(scope, args) {
  const positional = [];
  const named = Object.create(null);

  for (const arg of args) {
    if (arg.type === "narg") {
      named[arg.name] = resolveExpression(scope, arg.value);
    } else {
      positional.push(resolveExpression(scope, arg));
    }
  }

  return {positional, named};
}

// Resolve an expression to a Fluent type.
function resolveExpression(scope, expr) {
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
  let arg;
  if (scope.params) {
    // We're inside a TermReference. It's OK to reference undefined parameters.
    if (Object.prototype.hasOwnProperty.call(scope.params, name)) {
      arg = scope.params[name];
    } else {
      return new FluentNone(`$${name}`);
    }
  } else if (
    scope.args
    && Object.prototype.hasOwnProperty.call(scope.args, name)
  ) {
    // We're in the top-level Pattern or inside a MessageReference. Missing
    // variables references produce ReferenceErrors.
    arg = scope.args[name];
  } else {
    scope.reportError(new ReferenceError(`Unknown variable: $${name}`));
    return new FluentNone(`$${name}`);
  }

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
        return new FluentDateTime(arg.getTime());
      }
    default:
      scope.reportError(
        new TypeError(`Variable type not supported: $${name}, ${typeof arg}`)
      );
      return new FluentNone(`$${name}`);
  }
}

// Resolve a reference to another message.
function MessageReference(scope, {name, attr}) {
  const message = scope.bundle._messages.get(name);
  if (!message) {
    scope.reportError(new ReferenceError(`Unknown message: ${name}`));
    return new FluentNone(name);
  }

  if (attr) {
    const attribute = message.attributes[attr];
    if (attribute) {
      return resolvePattern(scope, attribute);
    }
    scope.reportError(new ReferenceError(`Unknown attribute: ${attr}`));
    return new FluentNone(`${name}.${attr}`);
  }

  if (message.value) {
    return resolvePattern(scope, message.value);
  }

  scope.reportError(new ReferenceError(`No value: ${name}`));
  return new FluentNone(name);
}

// Resolve a call to a Term with key-value arguments.
function TermReference(scope, {name, attr, args}) {
  const id = `-${name}`;
  const term = scope.bundle._terms.get(id);
  if (!term) {
    scope.reportError(new ReferenceError(`Unknown term: ${id}`));
    return new FluentNone(id);
  }

  if (attr) {
    const attribute = term.attributes[attr];
    if (attribute) {
      // Every TermReference has its own variables.
      scope.params = getArguments(scope, args).named;
      const resolved = resolvePattern(scope, attribute);
      scope.params = null;
      return resolved;
    }
    scope.reportError(new ReferenceError(`Unknown attribute: ${attr}`));
    return new FluentNone(`${id}.${attr}`);
  }

  scope.params = getArguments(scope, args).named;
  const resolved = resolvePattern(scope, term.value);
  scope.params = null;
  return resolved;
}

// Resolve a call to a Function with positional and key-value arguments.
function FunctionReference(scope, {name, args}) {
  // Some functions are built-in. Others may be provided by the runtime via
  // the `FluentBundle` constructor.
  const func = scope.bundle._functions[name] || builtins[name];
  if (!func) {
    scope.reportError(new ReferenceError(`Unknown function: ${name}()`));
    return new FluentNone(`${name}()`);
  }

  if (typeof func !== "function") {
    scope.reportError(new TypeError(`Function ${name}() is not callable`));
    return new FluentNone(`${name}()`);
  }

  try {
    let resolved = getArguments(scope, args);
    return func(resolved.positional, resolved.named);
  } catch (err) {
    scope.reportError(err);
    return new FluentNone(`${name}()`);
  }
}

// Resolve a select expression to the member object.
function SelectExpression(scope, {selector, variants, star}) {
  let sel = resolveExpression(scope, selector);
  if (sel instanceof FluentNone) {
    return getDefault(scope, variants, star);
  }

  // Match the selector against keys of each variant, in order.
  for (const variant of variants) {
    const key = resolveExpression(scope, variant.key);
    if (match(scope, sel, key)) {
      return resolvePattern(scope, variant.value);
    }
  }

  return getDefault(scope, variants, star);
}

// Resolve a pattern (a complex string with placeables).
export function resolveComplexPattern(scope, ptn) {
  if (scope.dirty.has(ptn)) {
    scope.reportError(new RangeError("Cyclic reference"));
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

    scope.placeables++;
    if (scope.placeables > MAX_PLACEABLES) {
      scope.dirty.delete(ptn);
      // This is a fatal error which causes the resolver to instantly bail out
      // on this pattern. The length check protects against excessive memory
      // usage, and throwing protects against eating up the CPU when long
      // placeables are deeply nested.
      throw new RangeError(
        `Too many placeables expanded: ${scope.placeables}, ` +
        `max allowed is ${MAX_PLACEABLES}`
      );
    }

    if (useIsolating) {
      result.push(FSI);
    }

    result.push(resolveExpression(scope, elem).toString(scope));

    if (useIsolating) {
      result.push(PDI);
    }
  }

  scope.dirty.delete(ptn);
  return result.join("");
}

// Resolve a simple or a complex Pattern to a FluentString (which is really the
// string primitive).
function resolvePattern(scope, node) {
  // Resolve a simple pattern.
  if (typeof node === "string") {
    return scope.bundle._transform(node);
  }

  return resolveComplexPattern(scope, node);
}
