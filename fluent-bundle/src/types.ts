import Scope from "./scope";

/* global Intl */

export type FluentTypeOrString = FluentType | string;

/**
 * The `FluentType` class is the base of Fluent's type system.
 *
 * Fluent types wrap JavaScript values and store additional configuration for
 * them, which can then be used in the `toString` method together with a proper
 * `Intl` formatter.
 */
export class FluentType {
  /** The wrapped native value. */
  public value: any;

  /**
   * Create a `FluentType` instance.
   *
   * @param   value - JavaScript value to wrap.
   */
  constructor(value: any) {
    this.value = value;
  }

  /**
   * Unwrap the raw value stored by this `FluentType`.
   */
  valueOf() {
    return this.value;
  }

  /**
   * Format this instance of `FluentType` to a string.
   *
   * Formatted values are suitable for use outside of the `FluentBundle`.
   * This method can use `Intl` formatters available through the `scope`
   * argument.
   *
   * @abstract
   */
  // eslint-disable-next-line no-unused-vars
  toString(scope: Scope): string {
    throw new Error("Subclasses of FluentType must implement toString.");
  }
}

/**
 * A `FluentType` representing no correct value.
 */
export class FluentNone extends FluentType {
  /**
   * Create an instance of `FluentNone` with an optional fallback value.
   * @param   value - The fallback value of this `FluentNone`.
   */
  constructor(value = "???") {
    super(value);
  }

  /**
   * Format this `FluentNone` to the fallback string.
   */
  toString(scope: Scope) {
    return `{${this.value}}`;
  }
}

/**
 * A `FluentType` representing a number.
 */
export class FluentNumber extends FluentType {
  /** Options passed to Intl.NumberFormat. */
  public opts: Intl.NumberFormatOptions;

  /**
   * Create an instance of `FluentNumber` with options to the
   * `Intl.NumberFormat` constructor.
   */
  constructor(value: number, opts: Intl.NumberFormatOptions = {}) {
    super(value);
    this.opts = opts;
  }

  /**
   * Format this `FluentNumber` to a string.
   */
  toString(scope: Scope) {
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
 */
export class FluentDateTime extends FluentType {
  /** Options passed to Intl.DateTimeFormat. */
  public opts: Intl.DateTimeFormatOptions;

  /**
   * Create an instance of `FluentDateTime` with options to the
   * `Intl.DateTimeFormat` constructor.
   * @param   value - timestamp in milliseconds
   * @param   opts
   */
  constructor(value: number, opts: Intl.DateTimeFormatOptions = {}) {
    super(value);
    this.opts = opts;
  }

  /**
   * Format this `FluentDateTime` to a string.
   */
  toString(scope: Scope) {
    try {
      const dtf = scope.memoizeIntlObject(Intl.DateTimeFormat, this.opts);
      return dtf.format(this.value);
    } catch (err) {
      scope.reportError(err);
      return new Date(this.value).toISOString();
    }
  }
}
