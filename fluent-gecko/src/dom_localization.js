/* global L10nRegistry, Services */
import DOMLocalization from "../../fluent-dom/src/dom_localization";

/**
 * The default localization strategy for Gecko. It comabines locales
 * available in L10nRegistry, with locales requested by the user to
 * generate the iterator over FluentBundles.
 *
 * In the future, we may want to allow certain modules to override this
 * with a different negotitation strategy to allow for the module to
 * be localized into a different language - for example DevTools.
 */
function defaultGenerateBundles(resourceIds) {
  const requestedLocales = Services.locale.getRequestedLocales();
  const availableLocales = L10nRegistry.getAvailableLocales();
  const defaultLocale = Services.locale.defaultLocale;
  const locales = Services.locale.negotiateLanguages(
    requestedLocales, availableLocales, defaultLocale,
  );
  return L10nRegistry.generateContexts(locales, resourceIds);
}


class GeckoDOMLocalization extends DOMLocalization {
  constructor(
    windowElement,
    resourceIds,
    generateBundles = defaultGenerateBundles
  ) {
    super(windowElement, resourceIds, generateBundles);
  }
}

this.DOMLocalization = GeckoDOMLocalization;
this.EXPORTED_SYMBOLS = ["DOMLocalization"];
