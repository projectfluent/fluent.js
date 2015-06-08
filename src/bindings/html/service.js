'use strict';

import Env from '../../lib/env';
import { View, init as initView } from './view';
import { getMeta } from './head';
import { getAdditionalLanguages, changeLanguage } from './langs';

export const L10n = {
  views: [],
  env: null,
  languages: null,
  requestLanguages: null
};

export function initViews(langs) {
  return Promise.all(
    this.views.map(view => initView.call(view, langs)));
}

export function onlanguagechage(
  appVersion, defaultLang, availableLangs, requestedLangs) {

  return this.languages = Promise.all([
    getAdditionalLanguages(), this.languages]).then(
      ([additionalLangs, prevLangs]) => changeLanguage(
        initViews.bind(this), appVersion, defaultLang, availableLangs,
        additionalLangs, prevLangs, requestedLangs || navigator.languages));
}

export function onadditionallanguageschange(
  appVersion, defaultLang, availableLangs, additionalLangs,
  requestedLangs) {

  return this.languages = this.languages.then(
    prevLangs => changeLanguage(
      initViews.bind(this), appVersion, defaultLang, availableLangs,
      additionalLangs, prevLangs, requestedLangs || navigator.languages));
}

export function init(fetch, additionalLangsAtLaunch) {
  let {
   defaultLang, availableLangs, appVersion
  } = getMeta(document.head);

  this.env = new Env(
    document.URL, defaultLang, fetch.bind(null, appVersion));
  this.views.push(
    document.l10n = new View(this, document));

  let setLanguage = additionalLangs => changeLanguage(
    initViews.bind(this), appVersion, defaultLang, availableLangs,
    additionalLangs, [], navigator.languages);

  this.languages = additionalLangsAtLaunch.then(
    setLanguage, setLanguage);

  this.requestLanguages = onlanguagechage.bind(
    this, appVersion, defaultLang, availableLangs);

  window.addEventListener('languagechange',
    () => onlanguagechage.call(
      this, appVersion, defaultLang, availableLangs,
      navigator.languages));
  document.addEventListener('additionallanguageschange',
    evt => onadditionallanguageschange.call(
      this, appVersion, defaultLang, availableLangs, evt.detail,
      navigator.languages));
}
