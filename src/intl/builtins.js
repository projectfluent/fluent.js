import { FTLNumber, FTLDateTime, FTLList } from './types';

// each builtin takes two arguments:
//  - args = an array of positional args
//  - opts  = an object of key-value args

export default {
  'NUMBER': ([arg], opts) => new FTLNumber(arg.valueOf(), valuesOf(opts)),
  'PLURAL': ([arg], opts) => new FTLNumber(arg.valueOf(), valuesOf(opts)),
  'DATETIME': ([arg], opts) => new FTLDateTime(arg.valueOf(), valuesOf(opts)),
  'LEN': ([arg], opts) => new FTLNumber(arg.valueOf().length, valuesOf(opts)),
  'LIST': (args) => FTLList.from(args),
  'TAKE': ([num, arg]) => FTLList.from(arg.valueOf().slice(0, num.value)),
  'DROP': ([num, arg]) => FTLList.from(arg.valueOf().slice(num.value)),
};

function valuesOf(opts) {
  return Object.keys(opts).reduce(
    (seq, cur) => Object.assign({}, seq, {
      [cur]: opts[cur].valueOf()
    }), {});
}
