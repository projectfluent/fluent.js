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

function values(opts: Record<string, FluentType>): Record<string, unknown> {
  const unwrapped: Record<string, unknown> = {};
  for (const [name, opt] of Object.entries(opts)) {
    unwrapped[name] = opt.valueOf();
  }
  return unwrapped;
}

export function NUMBER(
  args: Array<FluentType>,
  opts: Record<string, FluentType>
): FluentType {
  let arg = args[0];

  if (arg instanceof FluentNone) {
    return new FluentNone(`NUMBER(${arg.valueOf()})`);
  }

  if (arg instanceof FluentNumber || arg instanceof FluentDateTime) {
    return new FluentNumber(arg.valueOf(), { ...arg.opts, ...values(opts) });
  }

  throw new TypeError("Invalid argument to NUMBER");
}

export function DATETIME(
  args: Array<FluentType>,
  opts: Record<string, FluentType>
): FluentType {
  let arg = args[0];

  if (arg instanceof FluentNone) {
    return new FluentNone(`DATETIME(${arg.valueOf()})`);
  }

  if (arg instanceof FluentNumber || arg instanceof FluentDateTime) {
    return new FluentDateTime(arg.valueOf(), { ...arg.opts, ...values(opts) });
  }

  throw new TypeError("Invalid argument to DATETIME");
}
