import { MessageContext } from '../../intl/context';

this.EXPORTED_SYMBOLS = ['MessageContext'];

Components.utils.import('resource://gre/modules/IntlListFormat.jsm');
Components.utils.import('resource://gre/modules/IntlPluralRules.jsm');
Components.utils.import('resource://gre/modules/IntlRelativeTimeFormat.jsm');

Intl.PluralRules = PluralRules;
Intl.ListFormat = ListFormat;
Intl.RelativeTimeFormat = RelativeTimeFormat;

this.MessageContext = MessageContext;
