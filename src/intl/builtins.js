/**
 * @module
 *
 * The FTL resolver ships with a number of functions built-in.
 *
 * Each function take two arguments:
 *   - args - an array of positional args
 *   - opts - an object of key-value args
 *
 * Arguments to functions are guaranteed to already be instances of `FTLType`.
 * Functions must return `FTLType` objects as well.  For this reason it may be
 * necessary to unwrap the JavaScript value behind the FTL Value and to merge
 * the configuration of the argument with the configuration of the return
 * value.
 */
import { FTLNumber, FTLDateTime, FTLList } from './types';

export default {
  'NUMBER': ([arg], opts) =>
    new FTLNumber(arg.valueOf(), merge(arg.opts, opts)),
  'PLURAL': ([arg], opts) =>
    new FTLNumber(arg.valueOf(), merge(arg.opts, opts)),
  'DATETIME': ([arg], opts) =>
    new FTLDateTime(arg.valueOf(), merge(arg.opts, opts)),
  'LIST': (args) => FTLList.from(args),
  'LEN': ([arg]) => new FTLNumber(arg.valueOf().length),
  'TAKE': ([num, arg]) => FTLList.from(arg.valueOf().slice(0, num.value)),
  'DROP': ([num, arg]) => FTLList.from(arg.valueOf().slice(num.value)),
};

function merge(argopts, opts) {
  return Object.assign({}, argopts, valuesOf(opts));
}

function valuesOf(opts) {
  return Object.keys(opts).reduce(
    (seq, cur) => Object.assign({}, seq, {
      [cur]: opts[cur].valueOf()
    }), {});
}
