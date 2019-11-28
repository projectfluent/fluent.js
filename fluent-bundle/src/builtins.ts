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

import {
  FluentNone,
  FluentNumber,
  FluentDateTime,
  FluentType
} from "./types.js";

function values(opts: Record<string, FluentType>) {
  const unwrapped: Record<string, unknown> = {};
  for (const [name, opt] of Object.entries(opts)) {
    unwrapped[name] = opt.valueOf();
  }
  return unwrapped;
}

export function NUMBER(
  [arg]: Array<FluentType>,
  opts: Record<string, FluentType>
) {
  if (arg instanceof FluentNone) {
    return new FluentNone(`NUMBER(${arg.valueOf()})`);
  }

  if (arg instanceof FluentNumber) {
    return new FluentNumber(arg.valueOf(), { ...arg.opts, ...values(opts) });
  }

  throw new TypeError("Invalid argument to NUMBER");
}

export function DATETIME(
  [arg]: Array<FluentType>,
  opts: Record<string, FluentType>
) {
  if (arg instanceof FluentNone) {
    return new FluentNone(`DATETIME(${arg.valueOf()})`);
  }

  if (arg instanceof FluentNumber) {
    return new FluentDateTime(arg.valueOf(), { ...arg.opts, ...values(opts) });
  }

  throw new TypeError("Invalid argument to DATETIME");
}
