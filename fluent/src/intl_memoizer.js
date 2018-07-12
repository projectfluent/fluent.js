export default class IntlMemoizer {
  constructor() {
    this._intls = new WeakMap();
  }

  get(ctor, locales, opts) {
    const cache = this._intls.get(ctor) || new Map();
    const id = {locales, ...opts};

    if (!cache.has(id)) {
      cache.set(id, new ctor(locales, opts));
      this._intls.set(ctor, cache);
    }

    return cache.get(id);
  }
}
