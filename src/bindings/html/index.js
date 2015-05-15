'use strict';

import { 
  translateDocument, translateFragment, setL10nAttributes, getL10nAttributes
} from './dom';
import MozL10nMutationObserver from './observer';

var rtlList = ['ar', 'he', 'fa', 'ps', 'qps-plocm', 'ur'];

// Public API

export const L10n = {
  env: null,
  documentView: null,
  languages: null,
  observer: new MozL10nMutationObserver(),

  formatEntity: function(id, args) {
    return this.documentView.formatEntity(this.languages, id, args);
  },
  translateFragment: function (fragment) {
    return translateFragment.call(this, fragment);
  },
  setAttributes: setL10nAttributes,
  getAttributes: getL10nAttributes,

  // legacy compat
  readyState: 'complete',
  language: {
    code: 'en-US',
    direction: getDirection('en-US')
  },
  qps: {},
  get: id => id,
  // XXX temporary
  _ready: new Promise(function(resolve) {
    window.addEventListener('localized', resolve);
  }),
  ready: function ready(callback) {
    return this._ready.then(callback);
  },
  once: function once(callback) {
    return this._ready.then(callback);
  }
};

export function onlanguagechage(meta) {
  this.languages = Promise.all([
    navigator.mozApps.getAdditionalLanguages(), this.languages]).then(
      all => changeLanguage.call(
        this, meta, ...all, navigator.languages));
}

export function onadditionallanguageschange(meta, evt) {
  this.languages = this.languages.then(
    prevLangs => changeLanguage.call(
      this, meta, evt.detail, prevLangs, navigator.languages));
}

export function changeLanguage(
  meta, additionalLangs, prevLangs, requestedLangs) {

  let newLangs = getSupportedLanguages(
    meta, additionalLangs, requestedLangs);

  if (!arrEqual(prevLangs, newLangs)) {
    fetchViews.call(this);

    // XXX each l10n view should emit?
    document.dispatchEvent(new CustomEvent('supportedlanguageschange', {
      bubbles: false,
      cancelable: false,
      detail: {
        languages: newLangs
      }
    }));
  }

  return {
    langs: newLangs,
    srcs: getLanguageSources(meta, additionalLangs, newLangs)
  };
}

function arrEqual(arr1, arr2) {
  return arr1.length === arr2.length &&
    arr1.every((elem, i) => elem === arr2[i]);
}

function getDirection(lang) {
  return (rtlList.indexOf(lang) >= 0) ? 'rtl' : 'ltr';
}

export function getResourceLinks() {
  return Array.prototype.map.call(
    document.head.querySelectorAll('link[rel="localization"]'),
    (el) => el.getAttribute('href'));
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

export function getMeta(head) {
  let meta = {
    availableLanguages: Object.create(null),
    defaultLanguage: null,
    appVersion: null
  };

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
        meta.availableLanguages = getLangRevisionMap(
          meta.availableLanguages, content);
        break;
      case 'defaultLanguage':
        let [lang, rev] = getLangRevisionTuple(content);
        meta.defaultLanguage = lang;
        if (!(lang in meta.availableLanguages)) {
          meta.availableLanguages[lang] = rev;
        }
        break;
      case 'appVersion':
        meta.appVersion = content;
    }
  }
  return meta;
}

function getMatchingLangpack(appVersion, langpacks) {
  for (var i = 0, langpack; (langpack = langpacks[i]); i++) {
    if (langpack.target === appVersion) {
      return langpack;
    }
  }
  return null;
}

function getLanguageSources(
  {availableLanguages, appVersion}, additionalLangs, langs) {

  return langs.map(lang => {
    if (additionalLangs && additionalLangs[lang]) {
      let lp = getMatchingLangpack(appVersion, additionalLangs[lang]);
      if (lp &&
          (!(lang in availableLanguages) ||
           parseInt(lp.revision) > availableLanguages[lang])) {
        return 'extra';
      }
    }

    return 'app';
  });
}

function getSupportedLanguages(
  { defaultLanguage, availableLanguages }, additionalLangs, requestedLangs) {
  return negotiate(
    defaultLanguage,
    Object.keys(availableLanguages).concat(additionalLangs || []),
    requestedLangs);
}

function negotiate(def, availableLangs, requested) {
  var supportedLocale;
  // Find the first locale in the requested list that is supported.
  for (var i = 0; i < requested.length; i++) {
    var locale = requested[i];
    if (availableLangs.indexOf(locale) !== -1) {
      supportedLocale = locale;
      break;
    }
  }
  if (!supportedLocale ||
      supportedLocale === def) {
    return [def];
  }

  return [supportedLocale, def];
}


function fetchViews() {
  return this.documentView.fetch(this.languages, 1).then(
    onReady.bind(this));
}

function onReady() {
  translateDocument.call(this).then(
    dispatchEvent.bind(this, window, 'localized'));
  this.observer.start();
}

function dispatchEvent(root, name) {
  var event = new CustomEvent(name, {
    bubbles: false,
    cancelable: false,
    detail: {
      language: 'en-US'
    }
  });
  root.dispatchEvent(event);
}
