import { DocumentLocalization } from './dom';
import { generateContexts } from './registry';
import negotiateLanguages from '../../fluent-langneg/src/index';

function documentReady() {
  return new Promise(
    resolve => document.addEventListener(
      'DOMContentLoaded', resolve, { once: true }
    )
  );
}

function getMeta(elem) {
  return {
    available: elem.querySelector('meta[name="availableLanguages"]')
      .getAttribute('content')
      .split(','),
    default: elem.querySelector('meta[name="defaultLanguage"]')
      .getAttribute('content'),
  };
}

function getResourceLinks(elem) {
  return Array.prototype.map.call(
    elem.querySelectorAll('link[rel="localization"]'),
    el => el.getAttribute('href')
  );
}

const resIds = getResourceLinks(document.head);
const meta = getMeta(document.head);

document.l10n = new DocumentLocalization(document, resIds, (resIds) => {
  const locales = negotiateLanguages(
    navigator.languages,
    meta.available,
    {
      defaultLocale: meta.default
    }
  ); 
  return generateContexts(locales, resIds);
});

document.l10n.ready = documentReady().then(() => {
  document.l10n.connectRoot(document.documentElement);
  return document.l10n.translateDocument();
}).then(() => {
  document.body.style.display = 'block';
});
