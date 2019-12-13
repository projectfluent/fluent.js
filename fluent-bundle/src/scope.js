export default class Scope {
  constructor(bundle, errors, args) {
    /** The bundle for which the given resolution is happening. */
    this.bundle = bundle;
    /** The list of errors collected while resolving. */
    this.errors = errors;
    /** A dict of developer-provided variables. */
    this.args = args;

    /** The Set of patterns already encountered during this resolution.
      * Used to detect and prevent cyclic resolutions. */
    this.dirty = new WeakSet();
    /** A dict of parameters passed to a TermReference. */
    this.params = null;
    /** The running count of placeables resolved so far. Used to detect the
      * Billion Laughs and Quadratic Blowup attacks. */
    this.placeables = 0;
  }

  reportError(error) {
    if (!this.errors) {
      throw error;
    }
    this.errors.push(error);
  }

  memoizeIntlObject(ctor, opts) {
    let cache = this.bundle._intls.get(ctor);
    if (!cache) {
      cache = {};
      this.bundle._intls.set(ctor, cache);
    }
    let id = JSON.stringify(opts);
    if (!cache[id]) {
      cache[id] = new ctor(this.bundle.locales, opts);
    }
    return cache[id];
  }
}
