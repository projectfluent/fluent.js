/* eslint-env browser */

import { negotiateLanguages } from 'fluent-langneg';
import { MessageContext } from 'fluent';
import { DOMLocalization } from '../../fluent-dom/src/index';

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

function getMeta(elem) {
  return {
    available: elem.querySelector('meta[name="availableLanguages"]')
      .getAttribute('content')
      .split(',').map(s => s.trim()),
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

function fetchSync(url) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.send(null);
  return xhr.responseText;
}

const sync = true;

async function generateContext(locale, resourceIds) {
  const ctx = new MessageContext([locale]);
  for (const resourceId of resourceIds) {
    const url = resourceId.replace('{locale}', locale);
    const source = sync ?
      fetchSync(url) :
      await fetch(url).then(d => d.text());
    ctx.addMessages(source);
  }
  return ctx;
}

const meta = getMeta(document.head);

function * generateMessages(resourceIds) {
  const locales = negotiateLanguages(
    navigator.languages,
    meta.available,
    {
      defaultLocale: meta.default
    }
  );
  for (const locale of locales) {
    // This yields a promise. In the future we'd like to use async iteration.
    yield generateContext(locale, resourceIds);
  }
}

const resourceIds = getResourceLinks(document.head);
document.l10n = new DOMLocalization(
  window, resourceIds, generateMessages
);
window.addEventListener('languagechange', document.l10n);

document.l10n.ready = documentReady().then(() => {
  document.l10n.connectRoot(document.documentElement);
  return document.l10n.translateRoots().then(() => {
    document.body.style.display = 'block';
  });
});
