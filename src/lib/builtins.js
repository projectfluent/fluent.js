import { L20nIntl } from './shims';

export class FTLNone {
  constructor(value, opts) {
    this.value = value;
    this.opts = opts;
  }
  format() {
    return this.value || '???';
  }
  match() {
    return false;
  }
};

export class FTLText extends FTLNone {
  format() {
    return this.value.toString();
  }
  match(res, {value}) {
    return this.value === value;
  }
};

export class FTLNumber extends FTLText {
  constructor(value, opts) {
    super(parseFloat(value));
    this.opts = opts;
  }
  format(res) {
    const nf = res.ctx._memoizeIntlObject(
      L20nIntl.NumberFormat, res.lang, this.opts
    );
    return nf.format(this.value);
  }
  match(res, {value}) {
    switch (typeof value) {
      case 'number': return this.value === value;
      case 'string':
        const pr = res.ctx._memoizeIntlObject(
          L20nIntl.PluralRules, res.lang, this.opts
        );
        return pr.select(this.value) === value;
    }
  }
}

export class FTLDateTime extends FTLText {
  constructor(value, opts) {
    super(new Date(value));
    this.opts = opts;
  }
  format(res) {
    const dtf = res.ctx._memoizeIntlObject(
      L20nIntl.DateTimeFormat, res.lang, this.opts
    );
    return dtf.format(this.value);
  }
  match() {
    return false;
  }
}

export class FTLCategory extends FTLNumber {
  format(res) {
    const pr = res.ctx._memoizeIntlObject(
      L20nIntl.PluralRules, res.lang
    );
    return pr.select(this.value);
  }
  match(res, {value}) {
    switch (typeof value) {
      case 'number': return this.value === value;
      case 'string': return this.format(res) === value;
    }
  }
}

export class FTLKeyword extends FTLText {
  constructor(value, namespace) {
    super(value);
    this.namespace = namespace;
  }
  format() {
    return this.namespace ?
      `${this.namespace}:${this.value}` :
      this.value;
  }
  match(res, {namespace, value}) {
    return this.namespace === namespace && this.value === value;
  }
};

export class FTLKeyValueArg extends FTLText {
  constructor(value, id) {
    super(value);
    this.id = id;
  }
};

export class FTLList extends FTLText {
  format(res) {
    const lf = res.ctx._memoizeIntlObject(
      L20nIntl.ListFormat, res.lang, this.opts
    );
    const elems = this.value.map(
      elem => elem.format(res)
    );
    return lf.format(elems);
  }
  match() {
    return false;
  }
};

export default {
  'NUMBER': ([arg], opts) => new FTLNumber(arg.value, values(opts)),
  'DATETIME': ([arg], opts) => new FTLDateTime(arg.value, values(opts)),
  'PLURAL': ([arg], opts) => new FTLCategory(arg.value, values(opts)),
  'LIST': (...args) => new FTLList(...args),
  'LEN': ([arg], opts) => new FTLNumber(arg.value.length, values(opts)),
  'TAKE': ([num, arg], opts) =>
    new FTLList(arg.value.slice(0, num.value), values(opts)),
  'DROP': ([num, arg], opts) =>
    new FTLList(arg.value.slice(num.value), values(opts)),
};

function values(opts) {
  return Object.keys(opts).reduce(
    (seq, cur) => Object.assign({}, seq, {
      [cur]: opts[cur].value
    }), {});
}
