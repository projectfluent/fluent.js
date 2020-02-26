declare module "cached-iterable" {
  export class CachedSyncIterable<T> implements Iterable<T> {
    static from<U>(iterable: Iterable<U>): CachedSyncIterable<U>;
    constructor(iterable: Iterable<T>);
    [Symbol.iterator](): Iterator<T>;
    touchNext(count: number): IteratorResult<T>;
  }

  export class CachedAsyncIterable<T> implements AsyncIterable<T> {
    static from<U>(iterable: Iterable<U>): CachedAsyncIterable<U>;
    constructor(iterable: Iterable<T>);
    [Symbol.asyncIterator](): AsyncIterator<T>;
    touchNext(count: number): Promise<IteratorResult<T>>;
  }
}
