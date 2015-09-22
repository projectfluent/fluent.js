'use strict';

// Polyfill NodeList.prototype[Symbol.iterator] for Chrome.
// See https://code.google.com/p/chromium/issues/detail?id=401699
if (typeof NodeList === 'function' && !NodeList.prototype[Symbol.iterator]) {
  NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
}

// A document.ready shim
// https://github.com/whatwg/html/issues/127
export function documentReady() {
  if (document.readyState !== 'loading') {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    document.addEventListener('readystatechange', function onrsc() {
      document.removeEventListener('readystatechange', onrsc);
      resolve();
    });
  });
}

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
  // code:revision
  const [lang, rev]  = str.trim().split(':');
  // if revision is missing, use NaN
  return [lang, parseInt(rev)];
}
