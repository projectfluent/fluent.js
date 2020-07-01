import { FluentBundle, FluentVariable } from "./bundle.js";
import { ComplexPattern } from "./ast.js";

export class Scope {
  /** The bundle for which the given resolution is happening. */
  public bundle: FluentBundle;
  /** The list of errors collected while resolving. */
  public errors: Array<Error> | null;
  /** A dict of developer-provided variables. */
  public args: Record<string, FluentVariable> | null;
  /** The Set of patterns already encountered during this resolution.
   * Used to detect and prevent cyclic resolutions. */
  public dirty: WeakSet<ComplexPattern> = new WeakSet();
  /** A dict of parameters passed to a TermReference. */
  public params: Record<string, FluentVariable> | null = null;
  /** The running count of placeables resolved so far. Used to detect the
    * Billion Laughs and Quadratic Blowup attacks. */
  public placeables: number = 0;

  constructor(
    bundle: FluentBundle,
    errors: Array<Error> | null,
    args: Record<string, FluentVariable> | null,
  ) {
    this.bundle = bundle;
    this.errors = errors;
    this.args = args;
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
