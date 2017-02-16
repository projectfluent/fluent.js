/**
 * The `FTLType` class is the base of FTL's type system.
 *
 * FTL types wrap JavaScript values and store additional configuration for
 * them, which can then be used in the `toString` method together with a proper
 * `Intl` formatter.
 */
export class FTLType {

  /**
   * Create an `FTLType` instance.
   *
   * @param   {Any}    value - JavaScript value to wrap.
   * @param   {Object} opts  - Configuration.
   * @returns {FTLType}
   */
  constructor(value, opts) {
    this.value = value;
    this.opts = opts;
  }

  /**
   * Get the JavaScript value wrapped by this `FTLType` instance.
   *
   * @returns {Any}
   */
  valueOf() {
    return this.value;
  }

  /**
   * Stringify an instance of `FTLType`.
   *
   * This method can use `Intl` formatters memoized by the `MessageContext`
   * instance passed as an argument.
   *
   * @param   {MessageContext} ctx
   * @returns {string}
   */
  toString(ctx) {
    return this.value.toString(ctx);
  }
}

export class FTLNone extends FTLType {
  toString() {
    return this.value || '???';
  }
}

export class FTLNumber extends FTLType {
  constructor(value, opts) {
    super(parseFloat(value), opts);
  }
  toString(ctx) {
    const nf = ctx._memoizeIntlObject(
      Intl.NumberFormat, this.opts
    );
    return nf.format(this.value);
  }
}

export class FTLDateTime extends FTLType {
  constructor(value, opts) {
    super(new Date(value), opts);
  }
  toString(ctx) {
    const dtf = ctx._memoizeIntlObject(
      Intl.DateTimeFormat, this.opts
    );
    return dtf.format(this.value);
  }
}

export class FTLKeyword extends FTLType {
  toString() {
    const { name, namespace } = this.value;
    return namespace ? `${namespace}:${name}` : name;
  }
  match(ctx, other) {
    const { name, namespace } = this.value;
    if (other instanceof FTLKeyword) {
      return name === other.value.name && namespace === other.value.namespace;
    } else if (namespace) {
      return false;
    } else if (typeof other === 'string') {
      return name === other;
    } else if (other instanceof FTLNumber) {
      const pr = ctx._memoizeIntlObject(
        Intl.PluralRules, other.opts
      );
      return name === pr.select(other.valueOf());
    }
    return false;
  }
}
