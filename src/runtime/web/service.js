'use strict';

import { Env } from '../../lib/env';
import { pseudo } from '../../lib/pseudo';
import { fetch } from './io';
import { translateDocument } from '../../bindings/html/view';
import { getMeta, documentReady } from '../../bindings/html/head';
import { negotiateLanguages } from '../../bindings/html/langs';

export class Service {
  constructor(requestedLangs) {
    this.ctxs = new Map();
    this.interactive = documentReady().then(
      () => this.init(requestedLangs));
  }

  init(requestedLangs) {
    const meta = getMeta(document.head);
    this.defaultLanguage = meta.defaultLang;
    this.availableLanguages = meta.availableLangs;
    this.appVersion = meta.appVersion;

    this.env = new Env(
      this.defaultLanguage, fetch.bind(null, this.appVersion));

    return this.requestLanguages(requestedLangs);
  }

  registerView(view, resources) {
    return this.interactive.then(
      () => this.ctxs.set(view, this.env.createContext(resources)));
  }

  resolveEntities(view, langs, keys) {
    return this.ctxs.get(view).resolveEntities(langs, keys);
  }

  formatValues(view, keys) {
    return this.languages.then(
      langs => this.ctxs.get(view).resolveValues(langs, keys));
  }

  requestLanguages(requestedLangs) {
    return changeLanguages.call(
      this, getAdditionalLanguages(), requestedLangs);
  }

  getPseudoName(code) {
    return pseudo[code].name;
  }

  pseudotranslate(code, str) {
    return pseudo[code].process(str);
  }

  handleEvent(evt) {
    return changeLanguages.call(
      this, evt.detail || getAdditionalLanguages(), navigator.languages);
  }
}

export function getAdditionalLanguages() {
  if (navigator.mozApps && navigator.mozApps.getAdditionalLanguages) {
    return navigator.mozApps.getAdditionalLanguages().catch(
      () => []);
  }

  return Promise.resolve([]);
}

function translateViews(langs) {
  const views = Array.from(this.ctxs.keys());
  return Promise.all(
    views.map(view => translateDocument(view, langs)));
}

function changeLanguages(additionalLangs, requestedLangs) {
  const prevLangs = this.languages || [];
  return this.languages = Promise.all([
    additionalLangs, prevLangs]).then(
      ([additionalLangs, prevLangs]) => negotiateLanguages(
        translateViews.bind(this), this.appVersion, this.defaultLanguage,
        this.availableLanguages, additionalLangs, prevLangs, requestedLangs));
  }
