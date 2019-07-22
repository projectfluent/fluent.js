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
    return new FluentNone("NUMBER()");
  }

  if (arg instanceof FluentNumber) {
    return new FluentNumber(arg.valueOf(), merge(arg.opts, opts));
  }

  throw new TypeError("Invalid argument type to NUMBER");
}

export
function DATETIME([arg], opts) {
  if (arg instanceof FluentNone) {
    return new FluentNone("DATETIME()");
  }

  if (arg instanceof FluentDateTime) {
    return new FluentDateTime(arg.valueOf(), merge(arg.opts, opts));
  }

  throw new TypeError("Invalid argument type to DATETIME");
}
