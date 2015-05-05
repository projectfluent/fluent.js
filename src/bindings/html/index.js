'use strict';

import { 
  translateDocument, translateFragment, setL10nAttributes, getL10nAttributes
} from './dom';
import MozL10nMutationObserver from './observer';

var rtlList = ['ar', 'he', 'fa', 'ps', 'qps-plocm', 'ur'];

// readyState

var readyStates = {
  'loading': 0,
  'interactive': 1,
  'complete': 2
};

export function whenInteractive(callback) {
  if (readyStates[document.readyState] >= readyStates.interactive) {
    return callback();
  }

  document.addEventListener('readystatechange', function l10n_onrsc() {
    if (readyStates[document.readyState] >= readyStates.interactive) {
      document.removeEventListener('readystatechange', l10n_onrsc);
      callback();
    }
  });
}

// Public API

export const L10n = {
  env: null,
  documentView: null,
  fetched: null,
  meta: null,
  languages: null,
  languageSources: Object.create(null),
  observer: new MozL10nMutationObserver(),

  formatEntity: function(id, args) {
    return this.documentView.formatEntity(id, args);
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
  ready: function ready(callback) {
    return this.fetched.then(callback);
  },
  once: function once(callback) {
    return this.fetched.then(callback);
  },

  handleEvent: function(evt) {
    switch (evt.type) {
      case 'languagechange':
        this.languages = Promise.all([
          this.languages, navigator.mozApps.getAdditionalLanguages()]).then(
            all => changeLanguage.call(
              this, this.meta, ...all, navigator.languages));
        break;
      case 'additionallanguageschange':
        this.languages = this.languages.then(
          langs => changeLanguage.call(
            this, this.meta, langs, evt.detail, navigator.languages));
        break;
    }
  }
};

function changeLanguage(meta, prevLangs, additionalLangs, requestedLangs) {
  let newLangs = getSupportedLanguages(
    meta, additionalLangs, requestedLangs);
  this.languageSources = getLanguageSources(
    meta, additionalLangs);

  if (!arrEqual(prevLangs, newLangs)) {
    initLocale.call(this);

    // XXX each l10n view should emit?
    document.dispatchEvent(new CustomEvent('supportedlanguageschange', {
      bubbles: false,
      cancelable: false,
      detail: {
        languages: newLangs
      }
    }));
  }
  return newLangs;
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

export function getLanguageSources(
  {availableLanguages, appVersion}, additionalLangs) {

  var loc, lp;
  var localeSources = Object.create(null);

  for (loc in availableLanguages) {
    localeSources[loc] = 'app';
  }

  if (additionalLangs) {
    for (loc in additionalLangs) {
      lp = getMatchingLangpack(appVersion, additionalLangs[loc]);

      if (!lp) {
        continue;
      }
      if (!(loc in localeSources) ||
          !availableLanguages[loc] ||
          parseInt(lp.revision) > availableLanguages[loc]) {
        localeSources[loc] = 'extra';
      }
    }
  }

  return localeSources;
}


export function getSupportedLanguages(
  { defaultLanguage, availableLanguages }, additionalLangs, requestedLangs) {
  return negotiate(
    defaultLanguage,
    Object.keys(availableLanguages).concat(additionalLangs),
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


export function initLocale() {
  this.fetched = this.documentView.fetch(this.languages, 1);
  return this.fetched.then(
    onReady.bind(this));
}

function onReady() {
  translateDocument.call(this).then(
    fireLocalizedEvent.bind(this));
  this.observer.start();
}

function fireLocalizedEvent() {
  var event = new CustomEvent('localized', {
    bubbles: false,
    cancelable: false,
    detail: {
      language: 'en-US'
    }
  });
  window.dispatchEvent(event);
}
