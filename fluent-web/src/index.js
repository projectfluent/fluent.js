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

async function fetchResource(locale, id) {
  const url = id.replace("{locale}", locale);
  const response = await fetch(url);
  return response.text();
}

async function createContext(locale, resourceIds) {
  const ctx = new MessageContext([locale]);

  // First fetch all resources
  const resources = await Promise.all(
    resourceIds.map(id => fetchResource(locale, id))
  );

  // Then apply them preserving order
  for (const resource of resources) {
    ctx.addMessages(resource);
  }
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
    yield createContext(locale, resourceIds);
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
