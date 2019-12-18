import { FluentBundle, FluentArgument } from "./bundle.js";
import { ComplexPattern } from "./ast.js";

export class Scope {
  /** The bundle for which the given resolution is happening. */
  public bundle: FluentBundle;
  /** The list of errors collected while resolving. */
  public errors: Array<Error> | null;
  /** A dict of developer-provided variables. */
  public args: Record<string, FluentArgument> | null;
  /** Term references require different variable lookup logic. */
  public insideTermReference: boolean;
  /** The Set of patterns already encountered during this resolution.
   * Used to detect and prevent cyclic resolutions. */
  public dirty: WeakSet<ComplexPattern>;

  constructor(
    bundle: FluentBundle,
    errors: Array<Error> | null,
    args: Record<string, FluentArgument> | null,
    insideTermReference = false,
    dirty: WeakSet<ComplexPattern> = new WeakSet()
  ) {
    this.bundle = bundle;
    this.errors = errors;
    this.args = args;
    this.insideTermReference = insideTermReference;
    this.dirty = dirty;
  }

  cloneForTermReference(args: Record<string, FluentArgument>): Scope {
    return new Scope(this.bundle, this.errors, args, true, this.dirty);
  }

  reportError(error: Error): void {
    if (!this.errors) {
      throw error;
    }
    this.errors.push(error);
  }

  memoizeIntlObject<ObjectT extends object, OptionsT>(
    ctor: new (locales: Array<string>, opts: OptionsT) => ObjectT,
    opts: OptionsT
  ): ObjectT {
    let cache = this.bundle._intls.get(ctor);
    if (!cache) {
      cache = {};
      this.bundle._intls.set(ctor, cache);
    }
    let id = JSON.stringify(opts);
    if (!cache[id]) {
      cache[id] = new ctor(this.bundle.locales, opts);
    }
    return cache[id] as ObjectT;
  }
}
