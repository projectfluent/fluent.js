import type { FluentBundle } from "./bundle.js";
import type { MessageReference, TermReference } from "./ast.js";
import type { FluentVariable } from "./types.js";

export class Scope {
  /** The bundle for which the given resolution is happening. */
  public bundle: FluentBundle;
  /** The list of errors collected while resolving. */
  public errors: Array<Error> | null;
  /** A dict of developer-provided variables. */
  public args: Record<string, FluentVariable> | null;
  /**
   * The Set of patterns already encountered during this resolution.
   * Used to detect and prevent cyclic resolutions.
   * @ignore
   */
  public dirty: WeakSet<MessageReference | TermReference> = new WeakSet();
  /** A dict of parameters passed to a TermReference. */
  public params: Record<string, FluentVariable> | null = null;
  /**
   * The running count of placeables resolved so far.
   * Used to detect the Billion Laughs and Quadratic Blowup attacks.
   * @ignore
   */
  public placeables: number = 0;

  constructor(
    bundle: FluentBundle,
    errors: Array<Error> | null,
    args: Record<string, FluentVariable> | null
  ) {
    this.bundle = bundle;
    this.errors = errors;
    this.args = args;
  }

  reportError(error: unknown): void {
    if (!this.errors || !(error instanceof Error)) {
      throw error;
    }
    this.errors.push(error);
  }

  memoizeIntlObject(
    ctor: typeof Intl.NumberFormat,
    opts: Intl.NumberFormatOptions
  ): Intl.NumberFormat;
  memoizeIntlObject(
    ctor: typeof Intl.DateTimeFormat,
    opts: Intl.DateTimeFormatOptions
  ): Intl.DateTimeFormat;
  memoizeIntlObject(
    ctor: typeof Intl.PluralRules,
    opts: Intl.PluralRulesOptions
  ): Intl.PluralRules;
  memoizeIntlObject(
    ctor:
      | typeof Intl.NumberFormat
      | typeof Intl.DateTimeFormat
      | typeof Intl.PluralRules,
    opts: Intl.NumberFormatOptions &
      Intl.DateTimeFormatOptions &
      Intl.PluralRulesOptions
  ): Intl.NumberFormat | Intl.DateTimeFormat | Intl.PluralRules {
    let cache = this.bundle._intls.get(ctor);
    if (!cache) {
      cache = {};
      this.bundle._intls.set(ctor, cache);
    }
    let id = JSON.stringify(opts);
    if (!cache[id]) {
      // @ts-expect-error This is fine.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      cache[id] = new ctor(this.bundle.locales, opts);
    }
    return cache[id];
  }
}
