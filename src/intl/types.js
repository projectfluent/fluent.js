import { L20nIntl } from './index';

class FTLBase {
  constructor(value, opts) {
    this.value = value;
    this.opts = opts;
  }
  valueOf() {
    return this.value;
  }
}

export class FTLNone extends FTLBase {
  toString() {
    return this.value || '???';
  }
}

export class FTLNumber extends FTLBase {
  constructor(value, opts) {
    super(parseFloat(value), opts);
  }
  toString(ctx) {
    const nf = ctx._memoizeFormatter(
      L20nIntl.NumberFormat, this.opts
    );
    return nf.format(this.value);
  }
}

export class FTLDateTime extends FTLBase {
  constructor(value, opts) {
    super(new Date(value), opts);
  }
  toString(ctx) {
    const dtf = ctx._memoizeFormatter(
      L20nIntl.DateTimeFormat, this.opts
    );
    return dtf.format(this.value);
  }
}

export class FTLKeyword extends FTLBase {
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
      const pr = ctx._memoizeFormatter(
        L20nIntl.PluralRules, other.opts
      );
      return name === pr.select(other.valueOf());
    } else {
      return false;
    }
  }
}

export class FTLList extends Array {
  toString(ctx) {
    const lf = ctx._memoizeFormatter(
      L20nIntl.ListFormat // XXX add this.opts
    );
    const elems = this.map(
      elem => elem.toString(ctx)
    );
    return lf.format(elems);
  }
}

