'use strict';

import { prioritizeLocales } from '../../lib/intl';
import { initViews } from './service';

export function onlanguagechage(appVersion, defaultLang, availableLangs) {
  this.languages = Promise.all([
    navigator.mozApps.getAdditionalLanguages(), this.languages]).then(
      all => changeLanguage.call(
        this, appVersion, defaultLang, availableLangs, ...all,
        navigator.languages));
}

export function onadditionallanguageschange(
  appVersion, defaultLang, availableLangs, evt) {

  this.languages = this.languages.then(
    prevLangs => changeLanguage.call(
      this, appVersion, defaultLang, availableLangs, evt.detail, prevLangs,
      navigator.languages));
}


export function changeLanguage(
  appVersion, defaultLang, availableLangs, additionalLangs, prevLangs,
  requestedLangs) {

  let allAvailableLangs = Object.keys(availableLangs).concat(
    additionalLangs || []);
  let newLangs = prioritizeLocales(
    defaultLang, allAvailableLangs, requestedLangs);

  let langs = {
    langs: newLangs,
    srcs: newLangs.map(lang => getLangSource(
      appVersion, availableLangs, additionalLangs, lang))
  };

  if (!arrEqual(prevLangs, newLangs)) {
    initViews.call(this, langs);
  }

  return langs;

}

function arrEqual(arr1, arr2) {
  return arr1.length === arr2.length &&
    arr1.every((elem, i) => elem === arr2[i]);
}


function getMatchingLangpack(appVersion, langpacks) {
  for (var i = 0, langpack; (langpack = langpacks[i]); i++) {
    if (langpack.target === appVersion) {
      return langpack;
    }
  }
  return null;
}

function getLangSource(appVersion, availableLangs, additionalLangs, lang) {
  if (additionalLangs && additionalLangs[lang]) {
    let lp = getMatchingLangpack(appVersion, additionalLangs[lang]);
    if (lp &&
        (!(lang in availableLangs) ||
         parseInt(lp.revision) > availableLangs[lang])) {
      return 'extra';
    }
  }

  return 'app';
}
