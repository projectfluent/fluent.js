'use strict';

import { Env } from '../../lib/env';
import { translate } from './view';
import { getMeta } from './head';
import { negotiateLanguages } from './langs';

export class Service {
  constructor(fetch) {
    this.views = new Map();
    this.fetch = fetch;
  }

  register(view, resources) {
    const meta = getMeta(document.head);
    this.defaultLanguage = meta.defaultLang;
    this.availableLanguages = meta.availableLangs;
    this.appVersion = meta.appVersion;

    this.env = new Env(
      this.defaultLanguage, this.fetch.bind(null, this.appVersion));
    this.env.addEventListener('deprecatewarning',
      err => console.warn(err));
    this.views.set(view, this.env.createContext(resources));
    return this;
  }

  initView(view) {
    return this.languages.then(
      langs => this.views.get(view).fetch(langs));
  }

  resolveEntities(view, langs, keys) {
    return this.views.get(view).resolveEntities(langs, keys);
  }

  resolveValues(view, langs, keys) {
    return this.views.get(view).resolveValues(langs, keys);
  }

  requestLanguages(requestedLangs = navigator.languages) {
    return changeLanguages.call(
      this, getAdditionalLanguages(), requestedLangs);
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
  const views = Array.from(this.views);
  return Promise.all(
    views.map(tuple => translateView(langs, tuple)));
}

function translateView(langs, [view, ctx]) {
  return ctx.fetch(langs).then(
    translate.bind(view, langs));
}

function changeLanguages(additionalLangs, requestedLangs) {
  const prevLangs = this.languages || [];
  return this.languages = Promise.all([
    additionalLangs, prevLangs]).then(
      ([additionalLangs, prevLangs]) => negotiateLanguages(
        translateViews.bind(this), this.appVersion, this.defaultLanguage,
        this.availableLanguages, additionalLangs, prevLangs, requestedLangs));
  }
