import { getPluralRule } from './plurals';
import { MessageContext } from './context';
import { FTLNumber, FTLDateTime } from './types';

Intl.MessageContext = MessageContext;
Intl.MessageNumberArgument = FTLNumber;
Intl.MessageDateTimeArgument = FTLDateTime;

if (!Intl.NumberFormat) {
  Intl.NumberFormat = function() {
    return {
      format(n) {
        return n;
      }
    };
  };
}

if (!Intl.PluralRules) {
  Intl.PluralRules = function(code) {
    const fn = getPluralRule(code);
    return {
      select(n) {
        return fn(n);
      }
    };
  };
}
