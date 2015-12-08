'use strict';

import { Env } from '../../lib/env';
import { pseudo } from '../../lib/pseudo';
import { documentReady } from './shims';
import { getMeta, negotiateLanguages } from './langs';

export class Remote {
  constructor(fetchResource, broadcast, requestedLangs) {
    this.fetchResource = fetchResource;
    this.broadcast = broadcast;
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
      this.defaultLanguage,
      (...args) => this.fetchResource(this.appVersion, ...args));

    return this.requestLanguages(requestedLangs);
  }

  registerView(view, resources) {
    return this.interactive.then(() => {
      this.ctxs.set(view, this.env.createContext(resources));
      return true;
    });
  }

  unregisterView(view) {
    return this.ctxs.delete(view);
  }

  resolveEntities(view, langs, keys) {
    return this.ctxs.get(view).resolveEntities(langs, keys);
  }

  formatValues(view, keys) {
    return this.languages.then(
      langs => this.ctxs.get(view).resolveValues(langs, keys));
  }

  resolvedLanguages() {
    return this.languages;
  }

  requestLanguages(requestedLangs) {
    return changeLanguages.call(
      this, getAdditionalLanguages(), requestedLangs);
  }

  getName(code) {
    return pseudo[code].name;
  }

  processString(code, str) {
    return pseudo[code].process(str);
  }

  handleEvent(evt) {
    return changeLanguages.call(
      this, evt.detail || getAdditionalLanguages(), navigator.languages);
  }
}

export function getAdditionalLanguages() {
  if (navigator.mozApps && navigator.mozApps.getAdditionalLanguages) {
    return navigator.mozApps.getAdditionalLanguages()
      .catch(() => Object.create(null));
  }

  return Promise.resolve(Object.create(null));
}

function changeLanguages(additionalLangs, requestedLangs) {
  const prevLangs = this.languages || [];
  return this.languages = Promise.all([
    additionalLangs, prevLangs]).then(
      ([additionalLangs, prevLangs]) => negotiateLanguages(
        this.broadcast.bind(this, 'translateDocument'),
        this.appVersion, this.defaultLanguage, this.availableLanguages,
        additionalLangs, prevLangs, requestedLangs));
}
