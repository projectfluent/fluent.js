'use strict';

import { Env } from '../../lib/env';
import { translate } from './view';
import { getMeta } from './head';
import { negotiateLanguages } from './langs';

export class Service {
  constructor(fetch) {
    const meta = getMeta(document.head);
    this.defaultLanguage = meta.defaultLang;
    this.availableLanguages = meta.availableLangs;
    this.appVersion = meta.appVersion;

    this.env = new Env(
      this.defaultLanguage, fetch.bind(null, this.appVersion));
    this.views = new Map();

    this.env.addEventListener('deprecatewarning',
      err => console.warn(err));
  }

  register(view, resources) {
    this.views.set(view, this.env.createContext(resources));
    return this;
  }

  init(view) {
    return this.languages.then(
      langs => this.views.get(view).fetch(langs));
  }

  resolve(view, langs, id, args) {
    return this.views.get(view).resolve(langs, id, args);
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
