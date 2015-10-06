'use strict';

import { prioritizeLocales } from '../../lib/intl';
import { pseudo } from '../../lib/pseudo';

const rtlList = ['ar', 'he', 'fa', 'ps', 'qps-plocm', 'ur'];

export function getMeta(head) {
  let availableLangs = Object.create(null);
  let defaultLang = null;
  let appVersion = null;

  // XXX take last found instead of first?
  const metas = head.querySelectorAll(
    'meta[name="availableLanguages"],' +
    'meta[name="defaultLanguage"],' +
    'meta[name="appVersion"]');
  for (let meta of metas) {
    const name = meta.getAttribute('name');
    const content = meta.getAttribute('content').trim();
    switch (name) {
      case 'availableLanguages':
        availableLangs = getLangRevisionMap(
          availableLangs, content);
        break;
      case 'defaultLanguage':
        const [lang, rev] = getLangRevisionTuple(content);
        defaultLang = lang;
        if (!(lang in availableLangs)) {
          availableLangs[lang] = rev;
        }
        break;
      case 'appVersion':
        appVersion = content;
    }
  }

  return {
    defaultLang,
    availableLangs,
    appVersion
  };
}

function getLangRevisionMap(seq, str) {
  return str.split(',').reduce((seq, cur) => {
    const [lang, rev] = getLangRevisionTuple(cur);
    seq[lang] = rev;
    return seq;
  }, seq);
}

function getLangRevisionTuple(str) {
  const [lang, rev]  = str.trim().split(':');
  // if revision is missing, use NaN
  return [lang, parseInt(rev)];
}

export function negotiateLanguages(
  fn, appVersion, defaultLang, availableLangs, additionalLangs, prevLangs,
  requestedLangs) {

  const allAvailableLangs = Object.keys(availableLangs).concat(
    additionalLangs || []).concat(Object.keys(pseudo));
  const newLangs = prioritizeLocales(
    defaultLang, allAvailableLangs, requestedLangs);

  const langs = newLangs.map(code => ({
    code: code,
    src: getLangSource(appVersion, availableLangs, additionalLangs, code),
    dir: getDirection(code)
  }));

  if (!arrEqual(prevLangs, newLangs)) {
    fn(langs);
  }

  return langs;
}

export function getDirection(code) {
  return (rtlList.indexOf(code) >= 0) ? 'rtl' : 'ltr';
}

function arrEqual(arr1, arr2) {
  return arr1.length === arr2.length &&
    arr1.every((elem, i) => elem === arr2[i]);
}

function getMatchingLangpack(appVersion, langpacks) {
  for (let i = 0, langpack; (langpack = langpacks[i]); i++) {
    if (langpack.target === appVersion) {
      return langpack;
    }
  }
  return null;
}

function getLangSource(appVersion, availableLangs, additionalLangs, code) {
  if (additionalLangs && additionalLangs[code]) {
    const lp = getMatchingLangpack(appVersion, additionalLangs[code]);
    if (lp &&
        (!(code in availableLangs) ||
         parseInt(lp.revision) > availableLangs[code])) {
      return 'extra';
    }
  }

  if ((code in pseudo) && !(code in availableLangs)) {
    return 'pseudo';
  }

  return 'app';
}
