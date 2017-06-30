/* global Intl */

/**
 * The `FluentType` class is the base of Fluent's type system.
 *
 * Fluent types wrap JavaScript values and store additional configuration for
 * them, which can then be used in the `valueOf` method together with a proper
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
   * Unwrap the instance of `FluentType`.
   *
   * Unwrapped values are suitable for use outside of the `MessageContext`.
   * This method can use `Intl` formatters memoized by the `MessageContext`
   * instance passed as an argument.
   *
   * In most cases, valueOf returns a string, but it can be overriden
   * and there are use cases, where the return type is not a string.
   *
   * An example is fluent-react which implements a custom `FluentType`
   * to represent React elements passed as arguments to format().
   *
   * @param   {MessageContext} [ctx]
   * @returns {string}
   */
  valueOf() {
    throw new Error('Subclasses of FluentType must implement valueOf.');
  }
}

export class FluentNone extends FluentType {
  valueOf() {
    return this.value || '???';
  }
}

export class FluentNumber extends FluentType {
  constructor(value, opts) {
    super(parseFloat(value), opts);
  }

  valueOf(ctx) {
    const nf = ctx._memoizeIntlObject(
      Intl.NumberFormat, this.opts
    );
    return nf.format(this.value);
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

  valueOf(ctx) {
    const dtf = ctx._memoizeIntlObject(
      Intl.DateTimeFormat, this.opts
    );
    return dtf.format(this.value);
  }
}

export class FluentSymbol extends FluentType {
  valueOf() {
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
