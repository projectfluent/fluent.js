'use strict';

import { Env } from '../../lib/env';
import { View, translate } from './view';
import { getMeta } from './head';
import { negotiateLanguages } from './langs';

export class Service {
  constructor(fetch) {
    let meta = getMeta(document.head);
    this.defaultLanguage = meta.defaultLang;
    this.availableLanguages = meta.availableLangs;
    this.appVersion = meta.appVersion;

    this.env = new Env(
      this.defaultLanguage, fetch.bind(null, this.appVersion));
    this.views = [
      document.l10n = new View(this, document)
    ];

    this.env.addEventListener('deprecatewarning',
      err => console.warn(err));
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
  return Promise.all(
    this.views.map(view => translate.call(view, langs)));
}

function changeLanguages(additionalLangs, requestedLangs) {
  let prevLangs = this.languages || [];
  return this.languages = Promise.all([
    additionalLangs, prevLangs]).then(
      ([additionalLangs, prevLangs]) => negotiateLanguages(
        translateViews.bind(this), this.appVersion, this.defaultLanguage,
        this.availableLanguages, additionalLangs, prevLangs, requestedLangs));
  }
