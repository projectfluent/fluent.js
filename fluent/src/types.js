/* global Intl */

/**
 * The `FluentType` class is the base of Fluent's type system.
 *
 * Fluent types wrap JavaScript values and store additional configuration for
 * them, which can then be used in the `toString` method together with a proper
 * `Intl` formatter.
 */
export class FluentType {
  /**
   * Create a `FluentType` instance.
   *
   * @param   {Any}    value - JavaScript value to wrap.
   * @param   {Object} opts  - Configuration.
   * @returns {FluentType}
   */
  constructor(value, opts) {
    /** The wrapped native value. */
    this.value = value;
    /** Options passed to the corresponding Intl formatter. */
    this.opts = opts;
  }

  /**
   * Unwrap the raw value stored by this `FluentType`.
   *
   * @returns {Any}
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
   * @param   {Scope} scope
   * @returns {string}
   */
  toString(scope) { // eslint-disable-line no-unused-vars
    throw new Error("Subclasses of FluentType must implement toString.");
  }
}

/**
 * A `FluentType` representing no correct value.
 */
export class FluentNone extends FluentType {
  /**
   * Create an instance of `FluentNone` with an optional fallback value.
   * @param   {string} value - The fallback value of this `FluentNone`.
   * @returns {FluentType}
   */
  constructor(value = "???") {
    super(value);
  }

  /**
   * Format this `FluentNone` to the fallback string.
   * @returns {string}
   */
  toString() {
    return `{${this.value}}`;
  }
}

/**
 * A `FluentType` representing a number.
 */
export class FluentNumber extends FluentType {
  /**
   * Create an instance of `FluentNumber` with options to the
   * `Intl.NumberFormat` constructor.
   * @param   {number} value
   * @param   {Intl.NumberFormatOptions} opts
   * @returns {FluentType}
   */
  constructor(value, opts) {
    super(value, opts);
  }

  /**
   * Format this `FluentNumber` to a string.
   * @param   {Scope} scope
   * @returns {string}
   */
  toString(scope) {
    try {
      const nf = scope.memoizeIntlObject(Intl.NumberFormat, this.opts);
      return nf.format(this.value);
    } catch (err) {
      scope.reportError(err);
      return this.value;
    }
  }
}

/**
 * A `FluentType` representing a date and time.
 */
export class FluentDateTime extends FluentType {
  /**
   * Create an instance of `FluentDateTime` with options to the
   * `Intl.DateTimeFormat` constructor.
   * @param   {number} value
   * @param   {Intl.DateTimeFormatOptions} opts
   * @returns {FluentType}
   */
  constructor(value, opts) {
    super(value, opts);
  }

  /**
   * Format this `FluentDateTime` to a string.
   * @param   {Scope} scope
   * @returns {string}
   */
  toString(scope) {
    try {
      const dtf = scope.memoizeIntlObject(Intl.DateTimeFormat, this.opts);
      return dtf.format(this.value);
    } catch (err) {
      scope.reportError(err);
      return this.value;
    }
  }
}
