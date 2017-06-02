const Cu = Components.utils;
const Cc = Components.classes;
const Ci = Components.interfaces;

const { L10nRegistry } = Cu.import("resource://gre/modules/L10nRegistry.jsm", {});
const LocaleService = Cc["@mozilla.org/intl/localeservice;1"].getService(Ci.mozILocaleService);
const ObserverService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);

import Localization from '../../fluent-dom/src/localization';

this.Localization = Localization;
this.EXPORTED_SYMBOLS = [];
