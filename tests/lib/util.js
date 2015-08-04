'use strict';

// Unicode bidi isolation characters
export const FSI = '\u2068';
export const PDI = '\u2069';

// > isolate('Hello, world.');
// '\u2068Hello, world\u2069.'
//
// > isolate('Hello, world.', 'world');
// 'Hello, \u2068world\u2069.'
//
// > isolate('Hello, world.', 'Hello', 'world');
// '\u2068Hello\u2069, \u2068world\u2069.'
export function isolate(str, ...args) {
  return args.reduce(
    (seq, arg) => seq.replace(arg, FSI + arg + PDI),
    args.length ? str : FSI + str + PDI);
}
