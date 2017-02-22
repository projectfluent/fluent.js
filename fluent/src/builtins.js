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
    new FluentNumber(arg.value, merge(arg.opts, opts)),
  'DATETIME': ([arg], opts) =>
    new FluentDateTime(arg.value, merge(arg.opts, opts)),
};

function merge(argopts, opts) {
  return Object.assign({}, argopts, values(opts));
}

function values(opts) {
  const unwrapped = {};
  for (const name of Object.keys(opts)) {
    unwrapped[name] = opts[name].value;
  }
  return unwrapped;
}
