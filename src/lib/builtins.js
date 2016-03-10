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
  const nf = L20nIntl.NumberFormat(lang.code);
  const pr = L20nIntl.PluralRules(lang.code);

  return num => {
    const category = pr.select(num);
    return {
      equals(other) {
        return other === num || other === category;
      },
      format() {
        return nf.format(num);
      }
    };
  };
}

// XXX shim of ListFormat
export function LIST(lang) {
  return (...list) => {
    return {
      equals() {
        return false;
      },
      format(stringify) {
        return list.map(stringify).join(', ');
      }
    };
  }
}
