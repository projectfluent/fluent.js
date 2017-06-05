/* global document, fetch, navigator, MutationObserver */

import { DOMLocalization } from 'fluent-dom';
import { negotiateLanguages } from 'fluent-langneg';
import { MessageContext } from 'fluent';

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

function generateContexts(locales, resIds) {
  return locales.map(locale => {
    return {
      _ctx: null,
      async ready() {
        if (!this._ctx) {
          this._ctx = this.load();
        }
        return this._ctx;
      },
      async load() {
        const ctx = new MessageContext([locale]);
        for (const resId of resIds) {
          const source =
            await fetch(resId.replace('{locale}', locale)).then(d => d.text());
          ctx.addMessages(source);
        }
        return ctx;
      }
    };
  });
}

const meta = getMeta(document.head);

function generateMessages(id, resIds) {
  const locales = negotiateLanguages(
    navigator.languages,
    meta.available,
    {
      defaultLocale: meta.default
    }
  );
  return generateContexts(locales, resIds);
}

function createLocalization(resIds) {
  document.l10n =
    new DOMLocalization(MutationObserver, resIds, generateMessages);

  document.l10n.ready = documentReady().then(() => {
    document.l10n.connectRoot(document.documentElement);
    return document.l10n.translateRoots().then(() => {
      document.body.style.display = 'block';
    });
  });
}

createLocalization(getResourceLinks(document.head));
