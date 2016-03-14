import { L20nIntl } from './shims';

export function PLURAL(lang) {
  const pr = L20nIntl.PluralRules(lang.code);

  return num => {
    const category = pr.select(num);
    return {
      equals(other) {
        return other === num || other === category;
      },
      format() {
        return category;
      }
    };
  };
}

export function NUMBER(lang) {
  const pr = L20nIntl.PluralRules(lang.code);

  return (num, ...kwargs) => {
    const category = pr.select(num);
    return {
      equals(other) {
        return other === num || other === category;
      },
      format() {
        const opts = kwargs.reduce((seq, cur) => Object.assign(seq, {
          [cur.id]: cur.value
        }), {});

        // XXX how to cache opts?
        const nf = L20nIntl.NumberFormat(lang.code, opts);
        return nf.format(num);
      }
    };
  };
}

export function LIST(lang) {
  const lf = L20nIntl.ListFormat(lang.code);

  return (...list) => {
    return {
      equals() {
        return false;
      },
      format(stringify) {
        return lf.format(list.map(stringify));
      }
    };
  }
}
