'use strict';

export function getResourceLinks() {
  return Array.prototype.map.call(
    document.head.querySelectorAll('link[rel="localization"]'),
    (el) => el.getAttribute('href'));
}

export function getMeta(head) {
  let availableLangs = Object.create(null);
  let defaultLang = null;
  let appVersion = null;

  // XXX take last found instead of first?
  let els = head.querySelectorAll(
    'meta[name="availableLanguages"],' +
    'meta[name="defaultLanguage"],' +
    'meta[name="appVersion"]');
  for (let el of els) {
    let name = el.getAttribute('name');
    let content = el.getAttribute('content').trim();
    switch (name) {
      case 'availableLanguages':
        availableLangs = getLangRevisionMap(
          availableLangs, content);
        break;
      case 'defaultLanguage':
        let [lang, rev] = getLangRevisionTuple(content);
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
    let [lang, rev] = getLangRevisionTuple(cur);
    seq[lang] = rev;
    return seq;
  }, seq);
}

function getLangRevisionTuple(str) {
  // code:revision
  let [lang, rev]  = str.trim().split(':');
  // if revision is missing, use NaN
  return [lang, parseInt(rev)];
}
