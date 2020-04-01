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
 * `FluentValue`.  Functions must return `FluentValues` as well.
 */

import {
  FluentValue,
  FluentNone,
  FluentNumber,
  FluentDateTime
} from "./types.js";

function values(opts: Record<string, FluentValue>): Record<string, unknown> {
  const unwrapped: Record<string, unknown> = {};
  for (const [name, opt] of Object.entries(opts)) {
    unwrapped[name] = opt.valueOf();
  }
  return unwrapped;
}

export function NUMBER(
  args: Array<FluentValue>,
  opts: Record<string, FluentValue>
): FluentValue {
  let arg = args[0];

  if (arg instanceof FluentNone) {
    return new FluentNone(`NUMBER(${arg.valueOf()})`);
  }

  if (arg instanceof FluentNumber || arg instanceof FluentDateTime) {
    if (Object.prototype.hasOwnProperty.call(opts, "currency")) {
      throw new RangeError("Forbidden option to NUMBER: currency");
    }

    return new FluentNumber(arg.valueOf(), {
      ...arg.opts,
      ...values(opts)
    });
  }

  throw new TypeError("Invalid argument to NUMBER");
}

export function DATETIME(
  args: Array<FluentValue>,
  opts: Record<string, FluentValue>
): FluentValue {
  let arg = args[0];

  if (arg instanceof FluentNone) {
    return new FluentNone(`DATETIME(${arg.valueOf()})`);
  }

  if (arg instanceof FluentNumber || arg instanceof FluentDateTime) {
    return new FluentDateTime(arg.valueOf(), {
      ...arg.opts,
      ...values(opts)
    });
  }

  throw new TypeError("Invalid argument to DATETIME");
}
