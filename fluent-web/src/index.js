/* eslint-env browser */

import { DOMLocalization } from 'fluent-dom';
import negotiateLanguages from 'fluent-langneg';
import { MessageContext } from 'fluent';
import CachedIterable from '../../fluent/src/cached_iterable';

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

async function generateContext(locale, resIds) {
  const ctx = new MessageContext([locale]);
  for (const resId of resIds) {
    const url = resId.replace('{locale}', locale);
    const source = sync ?
      fetchSync(url) :
      await fetch(url).then(d => d.text());
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
