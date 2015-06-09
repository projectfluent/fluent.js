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
      this, appVersion, defaultLang, availableLangs, null);

    this.handleEvent = function(evt) {
      return onlanguagechage.call(
        this, appVersion, defaultLang, availableLangs, evt.detail,
        navigator.languages);
    };
  }
}

function translateViews(langs) {
  return Promise.all(
    this.views.map(view => translate.call(view, langs)));
}

export function onlanguagechage(
  appVersion, defaultLang, availableLangs,
  additionalLangs = getAdditionalLanguages(),
  requestedLangs = navigator.languages) {

  return this.languages = Promise.all([
    additionalLangs, this.languages]).then(
      ([additionalLangs, prevLangs]) => changeLanguage(
        translateViews.bind(this), appVersion, defaultLang, availableLangs,
        additionalLangs, prevLangs, requestedLangs));
}
