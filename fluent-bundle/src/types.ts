import { Scope } from "./scope.js";

export type FluentValue = FluentType<unknown> | string;

export type FluentFunction = (
  positional: Array<FluentValue>,
  named: Record<string, FluentValue>
) => FluentValue;

/**
 * The `FluentType` class is the base of Fluent's type system.
 *
 * Fluent types wrap JavaScript values and store additional configuration for
 * them, which can then be used in the `toString` method together with a proper
 * `Intl` formatter.
 */
export abstract class FluentType<T> {
  /** The wrapped native value. */
  public value: T;

  /**
   * Create a `FluentType` instance.
   *
   * @param value The JavaScript value to wrap.
   */
  constructor(value: T) {
    this.value = value;
  }

  /**
   * Unwrap the raw value stored by this `FluentType`.
   */
  valueOf(): T {
    return this.value;
  }

  /**
   * Format this instance of `FluentType` to a string.
   *
   * Formatted values are suitable for use outside of the `FluentBundle`.
   * This method can use `Intl` formatters available through the `scope`
   * argument.
   */
  abstract toString(scope: Scope): string;
}

/**
 * A `FluentType` representing no correct value.
 */
export class FluentNone extends FluentType<string> {
  /**
   * Create an instance of `FluentNone` with an optional fallback value.
   * @param value The fallback value of this `FluentNone`.
   */
  constructor(value = "???") {
    super(value);
  }

  /**
   * Format this `FluentNone` to the fallback string.
   */
  toString(scope: Scope): string {
    return `{${this.value}}`;
  }
}

/**
 * A `FluentType` representing a number.
 *
 * A `FluentNumber` instance stores the number value of the number it
 * represents. It may also store an option bag of options which will be passed
 * to `Intl.NumerFormat` when the `FluentNumber` is formatted to a string.
 */
export class FluentNumber extends FluentType<number> {
  /** Options passed to `Intl.NumberFormat`. */
  public opts: Intl.NumberFormatOptions;

  /**
   * Create an instance of `FluentNumber` with options to the
   * `Intl.NumberFormat` constructor.
   *
   * @param value The number value of this `FluentNumber`.
   * @param opts Options which will be passed to `Intl.NumberFormat`.
   */
  constructor(value: number, opts: Intl.NumberFormatOptions = {}) {
    super(value);
    this.opts = opts;
  }

  /**
   * Format this `FluentNumber` to a string.
   */
  toString(scope: Scope): string {
    try {
      const nf = scope.memoizeIntlObject(Intl.NumberFormat, this.opts);
      return nf.format(this.value);
    } catch (err) {
      scope.reportError(err);
      return this.value.toString(10);
    }
  }
}

/**
 * A `FluentType` representing a date and time.
 *
 * A `FluentDateTime` instance stores the number value of the date it
 * represents, as a numerical timestamp in milliseconds. It may also store an
 * option bag of options which will be passed to `Intl.DateTimeFormat` when the
 * `FluentDateTime` is formatted to a string.
 */
export class FluentDateTime extends FluentType<number> {
  /** Options passed to `Intl.DateTimeFormat`. */
  public opts: Intl.DateTimeFormatOptions;

  /**
   * Create an instance of `FluentDateTime` with options to the
   * `Intl.DateTimeFormat` constructor.
   *
   * @param value The number value of this `FluentDateTime`, in milliseconds.
   * @param opts Options which will be passed to `Intl.DateTimeFormat`.
   */
  constructor(value: number, opts: Intl.DateTimeFormatOptions = {}) {
    super(value);
    this.opts = opts;
  }

  /**
   * Format this `FluentDateTime` to a string.
   */
  toString(scope: Scope): string {
    try {
      const dtf = scope.memoizeIntlObject(Intl.DateTimeFormat, this.opts);
      return dtf.format(this.value);
    } catch (err) {
      scope.reportError(err);
      return new Date(this.value).toISOString();
    }
  }
}
