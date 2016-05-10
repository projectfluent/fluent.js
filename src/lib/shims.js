import { getPluralRule } from './plurals';

// Safari 9 and iOS 9 do not support Intl at all
export const L20nIntl = typeof Intl !== 'undefined' ? Intl : {};

if (!L20nIntl.NumberFormat) {
  L20nIntl.NumberFormat = function() {
    return {
      format(n) {
        return n;
      }
    };
  }
}

if (!L20nIntl.PluralRules) {
  L20nIntl.PluralRules = function(code) {
    const fn = getPluralRule(code);
    return {
      select(n) {
        return fn(n);
      }
    };
  }
}

if (!L20nIntl.ListFormat) {
  L20nIntl.ListFormat = function() {
    return {
      format(list) {
        return list.join(', ');
      }
    };
  }
}

export function prioritizeLocales(def, availableLangs, requested) {
  let supportedLocale;
  // Find the first locale in the requested list that is supported.
  for (let i = 0; i < requested.length; i++) {
    const locale = requested[i];
    if (availableLangs.indexOf(locale) !== -1) {
      supportedLocale = locale;
      break;
    }
  }
  if (!supportedLocale ||
      supportedLocale === def) {
    return [def];
  }

  return [supportedLocale, def];
}
