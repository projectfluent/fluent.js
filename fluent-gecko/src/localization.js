/* global Components */
/* eslint no-unused-vars: 0 */

const Cu = Components.utils;
const Cc = Components.classes;
const Ci = Components.interfaces;

const { L10nRegistry } =
  Cu.import("resource://gre/modules/L10nRegistry.jsm", {});
const ObserverService =
  Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
const { Services } =
  Cu.import("resource://gre/modules/Services.jsm", {});


import Localization from "../../fluent-dom/src/localization";

/**
 * The default localization strategy for Gecko. It comabines locales
 * available in L10nRegistry, with locales requested by the user to
 * generate the iterator over MessageContexts.
 *
 * In the future, we may want to allow certain modules to override this
 * with a different negotitation strategy to allow for the module to
 * be localized into a different language - for example DevTools.
 */
function defaultGenerateMessages(resourceIds) {
  const requestedLocales = Services.locale.getRequestedLocales();
  const availableLocales = L10nRegistry.getAvailableLocales();
  const defaultLocale = Services.locale.defaultLocale;
  const locales = Services.locale.negotiateLanguages(
    requestedLocales, availableLocales, defaultLocale,
  );
  return L10nRegistry.generateContexts(locales, resourceIds);
}

class GeckoLocalization extends Localization {
  constructor(resourceIds, generateMessages = defaultGenerateMessages) {
    super(resourceIds, generateMessages);
  }
}

this.Localization = GeckoLocalization;
this.EXPORTED_SYMBOLS = ["Localization"];
