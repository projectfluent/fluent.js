/* eslint-env browser */

import { negotiateLanguages } from "fluent-langneg";
import { MessageContext } from "fluent";
import { DOMLocalization } from "../../fluent-dom/src/index";

function documentReady() {
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

function getMeta(elem) {
  return {
    available: elem.querySelector('meta[name="availableLanguages"]')
      .getAttribute("content")
      .split(",").map(s => s.trim()),
    default: elem.querySelector('meta[name="defaultLanguage"]')
      .getAttribute("content"),
  };
}

function getResourceLinks(elem) {
  return Array.prototype.map.call(
    elem.querySelectorAll('link[rel="localization"]'),
    el => el.getAttribute("href")
  );
}

async function generateContext(locale, resourceIds) {
  const ctx = new MessageContext([locale]);
  await Promise.all(resourceIds.map(resourceId => {
    const url = resourceId.replace("{locale}", locale);
    return fetch(url)
      .then(d => d.text())
      .then(source => ctx.addMessages(source));
  }));
  return ctx;
}

const meta = getMeta(document.head);

function* generateMessages(resourceIds) {
  const locales = negotiateLanguages(
    navigator.languages,
    meta.available,
    {
      defaultLocale: meta.default
    }
  );
  for (const locale of locales) {
    yield generateContext(locale, resourceIds);
  }
}

const resourceIds = getResourceLinks(document.head);
document.l10n = new DOMLocalization(
  window, resourceIds, generateMessages
);
window.addEventListener("languagechange", document.l10n);

document.l10n.ready = documentReady().then(() => {
  document.l10n.connectRoot(document.documentElement);
  return document.l10n.translateRoots();
});
