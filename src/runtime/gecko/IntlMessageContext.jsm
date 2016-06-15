import { MessageContext } from '../../intl/context';

this.EXPORTED_SYMBOLS = ['MessageContext'];

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(Intl, "ListFormat",
  "resource://gre/modules/IntlListFormat.jsm");
XPCOMUtils.defineLazyModuleGetter(Intl, "PluralRules",
  "resource://gre/modules/IntlPluralRules.jsm");
XPCOMUtils.defineLazyModuleGetter(Intl, "RelativeTimeFormat",
  "resource://gre/modules/IntlRelativeTimeFormat.jsm");

this.MessageContext = MessageContext;
