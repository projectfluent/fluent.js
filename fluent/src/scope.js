export default class Scope {
  constructor(
    bundle,
    errors,
    args,
    insideTermReference = false,
    dirty = new WeakSet()
  ) {
    this.bundle = bundle;
    this.errors = errors;
    this.args = args;

    // Term references require different variable lookup logic.
    this.insideTermReference = insideTermReference;
    // Keeps track of visited Patterns. Used to detect cyclic references.
    this.dirty = dirty;
  }

  cloneForTermReference(args) {
    return new Scope(this.bundle, this.errors, args, true, this.dirty);
  }

  reportError(error) {
    if (!this.errors) {
      throw error;
    }
    this.errors.push(error);
  }
}
