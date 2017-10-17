/**
 * @overview
 *
 * The FTL resolver ships with a number of functions built-in.
 *
 * Each function take two arguments:
 *   - args - an array of positional args
 *   - opts - an object of key-value args
 *
 * Arguments to functions are guaranteed to already be instances of
 * `FluentType`.  Functions must return `FluentType` objects as well.
 */

import { FluentNumber, FluentDateTime } from './types';

export default {
  'NUMBER': ([arg], opts) =>
    new FluentNumber(value(arg), merge(arg.opts, opts)),
  'DATETIME': ([arg], opts) =>
    new FluentDateTime(value(arg), merge(arg.opts, opts)),
};

function merge(argopts, opts) {
  return Object.assign({}, argopts, values(opts));
}

function values(opts) {
  const unwrapped = {};
  for (const [name, opt] of Object.entries(opts)) {
    unwrapped[name] = value(opt);
  }
  return unwrapped;
}

function value(arg) {
  // StringExpression-typed options are parsed as regular strings by the
  // runtime parser and are not converted to a FluentType by the resolver.
  // They don't have the "value" property; they are the value.
  return typeof arg === 'string' ? arg : arg.value;
}
