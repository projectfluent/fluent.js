/* global Components, document, window */
{
  const { DOMLocalization } =
    Components.utils.import("resource://gre/modules/DOMLocalization.jsm");

  /**
   * Polyfill for document.ready polyfill.
   * See: https://github.com/whatwg/html/issues/127 for details.
   *
   * @returns {Promise}
   */
  function documentReady() {
    if (document.contentType === "application/vnd.mozilla.xul+xml") {
      // XUL
      return new Promise(
        resolve => document.addEventListener(
          "MozBeforeInitialXULLayout", resolve, { once: true }
        )
      );
    }

    // HTML
    const rs = document.readyState;
    if (rs === "interactive" || rs === "completed") {
      return Promise.resolve();
    }
    return new Promise(
      resolve => document.addEventListener(
        "readystatechange", resolve, { once: true }
      )
    );
  }

  /**
   * Scans the `elem` for links with localization resources.
   *
   * @param {Element} elem
   * @returns {Array<string>}
   */
  function getResourceLinks(elem) {
    return Array.from(elem.querySelectorAll('link[rel="localization"]')).map(
      el => el.getAttribute("href")
    );
  }

  const resourceIds = getResourceLinks(document.head || document);

  document.l10n = new DOMLocalization(window, resourceIds);

  // trigger first context to be fetched eagerly
  document.l10n.bundles.touchNext();

  document.l10n.ready = documentReady().then(() => {
    document.l10n.registerObservers();
    window.addEventListener("unload", () => {
      document.l10n.unregisterObservers();
    });
    document.l10n.connectRoot(document.documentElement);
    return document.l10n.translateRoots();
  });
}
