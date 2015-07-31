'use strict';

export function getResourceLinks(head) {
  return Array.prototype.map.call(
    head.querySelectorAll('link[rel="localization"]'),
    el => decodeURI(el.getAttribute('href')));
}

export function getMeta(head) {
  let availableLangs = Object.create(null);
  let defaultLang = null;
  let appVersion = null;

  // XXX take last found instead of first?
  const els = head.querySelectorAll(
    'meta[name="availableLanguages"],' +
    'meta[name="defaultLanguage"],' +
    'meta[name="appVersion"]');
  Array.prototype.forEach.call(els, el => {
    const name = el.getAttribute('name');
    const content = el.getAttribute('content').trim();
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
  });

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
  // code:revision
  const [lang, rev]  = str.trim().split(':');
  // if revision is missing, use NaN
  return [lang, parseInt(rev)];
}
