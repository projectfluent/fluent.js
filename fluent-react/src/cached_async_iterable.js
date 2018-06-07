/*
 * CachedAsyncIterable caches the elements yielded by an async iterable.
 *
 * It can be used to iterate over an iterable many times without depleting the
 * iterable.
 */
export default class CachedAsyncIterable {
    /**
     * Create an `CachedAsyncIterable` instance.
     *
     * @param {Iterable} iterable
     * @returns {CachedAsyncIterable}
     */
    constructor(iterable) {
        if (Symbol.asyncIterator in Object(iterable)) {
            this.iterator = iterable[Symbol.asyncIterator]();
        } else if (Symbol.iterator in Object(iterable)) {
            this.iterator = iterable[Symbol.iterator]();
        } else {
            throw new TypeError("Argument must implement the iteration protocol.");
        }

        this.seen = [];
    }

    /**
     * Synchronous iterator over the cached elements.
     *
     * Return a generator object implementing the iterator protocol over the
     * cached elements of the original (async or sync) iterable.
     */
    [Symbol.iterator]() {
        const {seen} = this;
        let cur = 0;

        return {
            next() {
                if (seen.length === cur) {
                    return {value: undefined, done: true};
                }
                return seen[cur++];
            }
        };
    }

    /**
     * Asynchronous iterator caching the yielded elements.
     *
     * Elements yielded by the original iterable will be cached and available
     * synchronously. Returns an async generator object implementing the
     * iterator protocol over the elements of the original (async or sync)
     * iterable.
     */
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
        // Return the last cached {value, done} object to allow the calling
        // code to decide if it needs to call touchNext again.
        return seen[seen.length - 1];
    }
}
