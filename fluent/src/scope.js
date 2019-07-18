export default class Scope {
  constructor(bundle, errors, args,
    insideTermReference = false, dirty = new WeakSet()
  ) {
    this.bundle = bundle;
    this.errors = errors;
    this.args = args;
    this.dirty = dirty;
    // TermReferences are resolved in a new scope.
    this.insideTermReference = insideTermReference;
  }

  clone(args) {
    return new Scope(this.bundle, this.errors, args, true, this.dirty);
  }

  reportError(error) {
    if (!this.errors) {
      throw error;
    }
    this.errors.push(error);
  }
}
