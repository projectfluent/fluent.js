'use strict';

import Env from '../../lib/env';
import { View, translate } from './view';
import { getMeta } from './head';
import { getAdditionalLanguages, changeLanguage } from './langs';

export class Service {
  constructor(fetch, bootstrap = Promise.resolve()) {
    let {
     defaultLang, availableLangs, appVersion
    } = getMeta(document.head);

    this.env = new Env(
      document.URL, defaultLang, fetch.bind(null, appVersion));
    this.views = [
      document.l10n = new View(this, document)
    ];

    let setLanguage = additionalLangs => changeLanguage(
      translateViews.bind(this), appVersion, defaultLang, availableLangs,
      additionalLangs, [], navigator.languages);

    this.languages = bootstrap.then(
      setLanguage, setLanguage);

    this.requestLanguages = onlanguagechage.bind(
      this, appVersion, defaultLang, availableLangs);

    this.handleEvent = function(evt) {
      switch(evt.type) {
        case 'languagechange':
          onlanguagechage.call(
            this, appVersion, defaultLang, availableLangs,
            navigator.languages);
          break;
        case 'additionallanguageschange':
          onadditionallanguageschange.call(
            this, appVersion, defaultLang, availableLangs, evt.detail,
            navigator.languages);
        break;
      }
    };
  }
}

export function translateViews(langs) {
  return Promise.all(
    this.views.map(view => translate.call(view, langs)));
}

export function onlanguagechage(
  appVersion, defaultLang, availableLangs, requestedLangs) {

  return this.languages = Promise.all([
    getAdditionalLanguages(), this.languages]).then(
      ([additionalLangs, prevLangs]) => changeLanguage(
        translateViews.bind(this), appVersion, defaultLang, availableLangs,
        additionalLangs, prevLangs, requestedLangs || navigator.languages));
}

export function onadditionallanguageschange(
  appVersion, defaultLang, availableLangs, additionalLangs,
  requestedLangs) {

  return this.languages = this.languages.then(
    prevLangs => changeLanguage(
      translateViews.bind(this), appVersion, defaultLang, availableLangs,
      additionalLangs, prevLangs, requestedLangs || navigator.languages));
}
