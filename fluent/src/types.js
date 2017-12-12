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
   * Unwrap the instance of `FluentType` to a string.
   *
   * Unwrapped values are suitable for use outside of the `MessageContext`.
   * This method can use `Intl` formatters memoized by the `MessageContext`
   * instance passed as an argument.
   *
   * @param   {MessageContext} [ctx]
   * @returns {string}
   */
  toString() {
    throw new Error('Subclasses of FluentType must implement toString.');
  }

  /**
   * Internal field used for detecting instances of FluentType.
   *
   * @private
   */
  get $$typeof() {
    return Symbol.for('FluentType');
  }

  /**
   * Check if a value is an instance of FluentType.
   *
   * In some build/transpilation setups instanceof is unreliable for detecting
   * subclasses of FluentType. Instead, FluentType.isTypeOf uses the $$typeof
   * field and the FluentType Symbol to determine the type of the argument.
   *
   * @param {Any} obj - The value to check the type of.
   * @returns {bool}
   */
  static isTypeOf(obj) {
    // The best-case scenario: the bundler didn't break the identity of
    // FluentType.
    if (obj instanceof FluentType) {
      return true;
    }

    // Discard all primitive values, Object.prototype, and Object.create(null)
    // which by definition cannot be instances of FluentType. Then check the
    // value of the custom $$typeof field defined by the base FluentType class.
    return obj instanceof Object
      && obj.$$typeof === Symbol.for('FluentType');
  }
}

export class FluentNone extends FluentType {
  toString() {
    return this.value || '???';
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
    } else if (typeof other === 'string') {
      return this.value === other;
    } else if (other instanceof FluentNumber) {
      const pr = ctx._memoizeIntlObject(
        Intl.PluralRules, other.opts
      );
      return this.value === pr.select(other.value);
    } else if (Array.isArray(other)) {
      const values = other.map(symbol => symbol.value);
      return values.includes(this.value);
    }
    return false;
  }
}
