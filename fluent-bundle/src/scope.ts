import { FluentBundle } from "./bundle";
import { FluentError } from "./error";
import { RuntimeComplexPattern } from "./ast";

export class Scope {
  /** The bundle for which the given resolution is happening. */
  public bundle: FluentBundle;
  /** The list of errors collected while resolving. */
  public errors: Array<FluentError>;
  /** A dict of developer-provided variables. */
  public args: Record<string, any>;
  /** Term references require different variable lookup logic. */
  public insideTermReference: boolean;
  /** The Set of patterns already encountered during this resolution.
   * Used to detect and prevent cyclic resolutions. */
  public dirty: WeakSet<RuntimeComplexPattern>;

  constructor(
    bundle: FluentBundle,
    errors: Array<FluentError>,
    args: Record<string, any>,
    insideTermReference = false,
    dirty: WeakSet<RuntimeComplexPattern> = new WeakSet()
  ) {
    this.bundle = bundle;
    this.errors = errors;
    this.args = args;
    this.insideTermReference = insideTermReference;
    this.dirty = dirty;
  }

  cloneForTermReference(args: Record<string, any>) {
    return new Scope(this.bundle, this.errors, args, true, this.dirty);
  }

  reportError(error: FluentError) {
    if (!this.errors) {
      throw error;
    }
    this.errors.push(error);
  }

  memoizeIntlObject(ctor: any, opts: any) {
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
