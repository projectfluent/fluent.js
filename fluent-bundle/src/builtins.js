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

import { FluentNone, FluentNumber, FluentDateTime } from "./types.js";

function merge(argopts, opts) {
  return Object.assign({}, argopts, values(opts));
}

function values(opts) {
  const unwrapped = {};
  for (const [name, opt] of Object.entries(opts)) {
    unwrapped[name] = opt.valueOf();
  }
  return unwrapped;
}

export
function NUMBER([arg], opts) {
  if (arg instanceof FluentNone) {
    return new FluentNone(`NUMBER(${arg.valueOf()})`);
  }

  let value = Number(arg.valueOf());
  if (Number.isNaN(value)) {
    throw new TypeError("Invalid argument to NUMBER");
  }

  return new FluentNumber(value, merge(arg.opts, opts));
}

export
function DATETIME([arg], opts) {
  if (arg instanceof FluentNone) {
    return new FluentNone(`DATETIME(${arg.valueOf()})`);
  }

  let value = Number(arg.valueOf());
  if (Number.isNaN(value)) {
    throw new TypeError("Invalid argument to DATETIME");
  }

  return new FluentDateTime(value, merge(arg.opts, opts));
}
