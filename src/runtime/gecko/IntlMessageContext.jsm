import { MessageContext } from '../../intl/context';

this.EXPORTED_SYMBOLS = ['MessageContext'];

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(Intl, "PluralRules",
  "resource://gre/modules/IntlPluralRules.jsm");

this.MessageContext = MessageContext;
