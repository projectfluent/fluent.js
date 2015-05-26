'use strict';

import { prioritizeLocales } from '../../lib/intl';
import { initViews } from './service';
import qps from '../../lib/pseudo';

const rtlList = ['ar', 'he', 'fa', 'ps', 'qps-plocm', 'ur'];

export function getAdditionalLanguages() {
  if (navigator.mozApps && navigator.mozApps.getAdditionalLanguages) {
    return navigator.mozApps.getAdditionalLanguages().catch(
      () => []);
  }

  return Promise.resolve([]);
}

export function onlanguagechage(
  appVersion, defaultLang, availableLangs, requestedLangs) {

  return this.languages = Promise.all([
    getAdditionalLanguages(), this.languages]).then(
      all => changeLanguage.call(
        this, appVersion, defaultLang, availableLangs, ...all,
        requestedLangs || navigator.languages));
}

export function onadditionallanguageschange(
  appVersion, defaultLang, availableLangs, additionalLangs, requestedLangs) {

  return this.languages = this.languages.then(
    prevLangs => changeLanguage.call(
      this, appVersion, defaultLang, availableLangs, additionalLangs,
      prevLangs, requestedLangs || navigator.languages));
}


export function changeLanguage(
  appVersion, defaultLang, availableLangs, additionalLangs, prevLangs,
  requestedLangs) {

  let allAvailableLangs = Object.keys(availableLangs).concat(
    additionalLangs || []).concat(Object.keys(qps));
  let newLangs = prioritizeLocales(
    defaultLang, allAvailableLangs, requestedLangs);

  let langs = newLangs.map(code => ({
    code: code,
    src: getLangSource(appVersion, availableLangs, additionalLangs, code),
    dir: getDirection(code)
  }));

  if (!arrEqual(prevLangs, newLangs)) {
    initViews.call(this, langs);
  }

  return langs;
}

function getDirection(code) {
  return (rtlList.indexOf(code) >= 0) ? 'rtl' : 'ltr';
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

function getLangSource(appVersion, availableLangs, additionalLangs, code) {
  if (additionalLangs && additionalLangs[code]) {
    let lp = getMatchingLangpack(appVersion, additionalLangs[code]);
    if (lp &&
        (!(code in availableLangs) ||
         parseInt(lp.revision) > availableLangs[code])) {
      return 'extra';
    }
  }

  if ((code in qps) && !(code in availableLangs)) {
    return 'qps';
  }

  return 'app';
}
