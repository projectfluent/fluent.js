/*
 * CachedIterable caches the elements yielded by an iterable.
 *
 * It can be used to iterate over an iterable many times without depleting the
 * iterable.
 */
export default class CachedIterable {
  constructor(iterable) {
    if (!(Symbol.iterator in Object(iterable))) {
      throw new TypeError('Argument must implement the iteration protocol.');
    }

    this.iterator = iterable[Symbol.iterator]();
    this.seen = [];
  }

  [Symbol.iterator]() {
    const { seen, iterator } = this;
    let cur = 0;

    return {
      next() {
        if (seen.length <= cur) {
          seen.push(iterator.next());
        }
        return seen[cur++];
      }
    };
  }
}
