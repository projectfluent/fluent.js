/*
 * CachedIterable caches the elements yielded by an iterable.
 *
 * It can be used to iterate over an iterable many times without depleting the
 * iterable.
 */
export class CachedIterable {
  /**
   * Create an `CachedIterable` instance.
   *
   * @param {Iterable} iterable
   * @returns {CachedIterable}
   */
  constructor(iterable) {
    if (Symbol.iterator in Object(iterable)) {
      this.iterator = iterable[Symbol.iterator]();
    } else {
      throw new TypeError("Argument must implement the iteration protocol.");
    }

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

  /**
   * This method allows user to consume the next element from the iterator
   * into the cache.
   *
   * @param {number} count - number of elements to consume
   */
  touchNext(count = 1) {
    const { seen, iterator } = this;
    let idx = 0;
    while (idx++ < count) {
      if (seen.length === 0 || seen[seen.length - 1].done === false) {
        seen.push(iterator.next());
      }
    }
  }
}

/*
 * CachedAsyncIterable caches the elements yielded by an async iterable.
 *
 * It can be used to iterate over an iterable many times without depleting the
 * iterable.
 */
export class CachedAsyncIterable {
  /**
   * Create an `CachedAsyncIterable` instance.
   *
   * @param {Iterable} iterable
   * @returns {CachedAsyncIterable}
   */
  constructor(iterable) {
    if (Symbol.asyncIterator in Object(iterable)) {
      this.iterator = iterable[Symbol.asyncIterator]();
    } else {
      throw new TypeError("Argument must implement the iteration protocol.");
    }

    this.seen = [];
  }

  [Symbol.asyncIterator]() {
    const { seen, iterator } = this;
    let cur = 0;

    return {
      async next() {
        if (seen.length <= cur) {
          seen.push(await iterator.next());
        }
        return seen[cur++];
      }
    };
  }

  /**
   * This method allows user to consume the next element from the iterator
   * into the cache.
   *
   * @param {number} count - number of elements to consume
   */
  async touchNext(count = 1) {
    const { seen, iterator } = this;
    let idx = 0;
    while (idx++ < count) {
      if (seen.length === 0 || seen[seen.length - 1].done === false) {
        seen.push(await iterator.next());
      }
    }
  }
}
