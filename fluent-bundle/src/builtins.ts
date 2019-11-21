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
  FluentTypeOrString
} from "./types";

function values(opts: Record<string, FluentTypeOrString>) {
  const unwrapped: Record<string, any> = {};
  for (const [name, opt] of Object.entries(opts)) {
    unwrapped[name] = opt.valueOf();
  }
  return unwrapped;
}

export function NUMBER(
  [arg]: Array<FluentTypeOrString>,
  opts: Record<string, FluentTypeOrString>
) {
  if (arg instanceof FluentNone) {
    return new FluentNone(`NUMBER(${arg.valueOf()})`);
  }

  if (arg instanceof FluentNumber) {
    let value = Number(arg.valueOf());
    if (Number.isNaN(value)) {
      throw new TypeError("Invalid argument to NUMBER");
    }
    return new FluentNumber(value, { ...arg.opts, ...values(opts) });
  }

  return new FluentNone("NUMBER(???)");
}

export function DATETIME(
  [arg]: Array<FluentTypeOrString>,
  opts: Record<string, FluentTypeOrString>
) {
  if (arg instanceof FluentNone) {
    return new FluentNone(`DATETIME(${arg.valueOf()})`);
  }

  if (arg instanceof FluentDateTime) {
    let value = Number(arg.valueOf());
    if (Number.isNaN(value)) {
      throw new TypeError("Invalid argument to DATETIME");
    }

    return new FluentDateTime(value, { ...arg.opts, ...values(opts) });
  }

  return new FluentNone("DATETIME(???)");
}
