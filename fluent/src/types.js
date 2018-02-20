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
   * Formatted values are suitable for use outside of the `MessageContext`.
   * This method can use `Intl` formatters memoized by the `MessageContext`
   * instance passed as an argument.
   *
   * @param   {MessageContext} [ctx]
   * @returns {string}
   */
  toString() {
    throw new Error("Subclasses of FluentType must implement toString.");
  }
}

export class FluentNone extends FluentType {
  toString() {
    return this.value || "???";
  }
}

export class FluentNumber extends FluentType {
  constructor(value, opts) {
    super(parseFloat(value), opts);
  }

  toString(ctx) {
    try {
      const nf = ctx._memoizeIntlObject(
        Intl.NumberFormat, this.opts
      );
      return nf.format(this.value);
    } catch (e) {
      // XXX Report the error.
      return this.value;
    }
  }

  /**
   * Compare the object with another instance of a FluentType.
   *
   * @param   {MessageContext} ctx
   * @param   {FluentType}     other
   * @returns {bool}
   */
  match(ctx, other) {
    if (other instanceof FluentNumber) {
      return this.value === other.value;
    }
    return false;
  }
}

export class FluentDateTime extends FluentType {
  constructor(value, opts) {
    super(new Date(value), opts);
  }

  toString(ctx) {
    try {
      const dtf = ctx._memoizeIntlObject(
        Intl.DateTimeFormat, this.opts
      );
      return dtf.format(this.value);
    } catch (e) {
      // XXX Report the error.
      return this.value;
    }
  }
}

export class FluentSymbol extends FluentType {
  toString() {
    return this.value;
  }

  /**
   * Compare the object with another instance of a FluentType.
   *
   * @param   {MessageContext} ctx
   * @param   {FluentType}     other
   * @returns {bool}
   */
  match(ctx, other) {
    if (other instanceof FluentSymbol) {
      return this.value === other.value;
    } else if (typeof other === "string") {
      return this.value === other;
    } else if (other instanceof FluentNumber) {
      const pr = ctx._memoizeIntlObject(
        Intl.PluralRules, other.opts
      );
      return this.value === pr.select(other.value);
    }
    return false;
  }
}
