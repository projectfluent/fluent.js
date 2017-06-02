const { DocumentLocalization } =
  Components.utils.import("resource://gre/modules/DOMLocalization.jsm");

function documentReady() {
  const rs = document.readyState;
  if (rs === 'interactive' || rs === 'completed') {
    return Promise.resolve();
  }

  return new Promise(
    resolve => document.addEventListener(
      'readystatechange', resolve, { once: true }
    )
  );
}

function getResourceLinks(elem) {
  return Array.prototype.map.call(
    elem.querySelectorAll('link[rel="localization"]'),
    el => el.getAttribute('href')
  );
}

function createLocalization(resIds) {
  document.l10n = new DocumentLocalization(document, resIds);

  document.l10n.registerObservers();
  window.addEventListener('unload', () => {
    document.l10n.unregisterObservers();
  });

  document.l10n.ready = documentReady().then(() => {
    document.l10n.connectRoot(document.documentElement);
    return document.l10n.translateDocument();
  });
}

const resIds = getResourceLinks(document.head || document);
createLocalization(resIds);

