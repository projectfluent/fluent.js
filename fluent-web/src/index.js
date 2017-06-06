/* global document, fetch, navigator, MutationObserver */

import { DOMLocalization } from 'fluent-dom';
import negotiateLanguages from 'fluent-langneg';
import { MessageContext, CachedIterable } from 'fluent';

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

async function generateContext(locale, resIds) {
  const ctx = new MessageContext([locale]);
  for (const resId of resIds) {
    const source =
      await fetch(resId.replace('{locale}', locale)).then(d => d.text());
    ctx.addMessages(source);
  }
  return ctx;
}

const meta = getMeta(document.head);

function * generateMessages(resIds) {
  const locales = negotiateLanguages(
    navigator.languages,
    meta.available,
    {
      defaultLocale: meta.default
    }
  );
  for (const locale of locales) {
    yield generateContext(locale, resIds);
  }
}

function createLocalization(resIds) {
  document.l10n =
    new DOMLocalization(MutationObserver, resIds, ids => {
      return new CachedIterable(generateMessages(ids));
    });

  document.l10n.ready = documentReady().then(() => {
    document.l10n.connectRoot(document.documentElement);
    return document.l10n.translateRoots().then(() => {
      document.body.style.display = 'block';
    });
  });
}

createLocalization(getResourceLinks(document.head));
