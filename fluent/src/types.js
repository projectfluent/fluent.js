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
   * Create an `FluentType` instance.
   *
   * @param   {Any}    value - JavaScript value to wrap.
   * @param   {Object} opts  - Configuration.
   * @returns {FluentType}
   */
  constructor(value, opts) {
    this.value = value;
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
   * @param   {Scope} scope
   * @returns {string}
   */
  toString(scope) { // eslint-disable-line no-unused-vars
    throw new Error("Subclasses of FluentType must implement toString.");
  }
}

export class FluentNone extends FluentType {
  /**
   * @param   {string} value - The fallback value of this FluentNone
   * @returns {FluentType}
   */
  constructor(value = "???") {
    super(value);
  }

  /**
   * @returns {string}
   */
  toString() {
    return `{${this.value}}`;
  }
}

export class FluentNumber extends FluentType {
  /**
   * @param   {(number|string)} value
   * @param   {Object} opts
   * @returns {FluentType}
   */
  constructor(value, opts) {
    super(parseFloat(value), opts);
  }

  /**
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

export class FluentDateTime extends FluentType {
  /**
   * @param   {(Date|number|string)} value
   * @param   {Object} opts
   * @returns {FluentType}
   */
  constructor(value, opts) {
    super(new Date(value), opts);
  }

  /**
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
