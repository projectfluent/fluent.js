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

var interactive = new Promise(function(resolve) {
  return whenInteractive(resolve);
});


// Public API

var meta = {
  defaultLanguage: getDefaultLanguage(),
  bundledLanguages: getBundledLanguages(),
  appVersion: getAppVersion(),
};

navigator.mozL10n = {
  env: null,
  documentView: null,
  fetched: null,

  get: function get(id) {
    return id;
  },
  formatEntity: function(id, args) {
    return navigator.mozL10n.documentView.formatEntity(id, args);
  },
  translateFragment: function (fragment) {
    return translateFragment.call(navigator.mozL10n, fragment);
  },
  setAttributes: setL10nAttributes,
  getAttributes: getL10nAttributes,
  ready: function ready(callback) {
    return this.fetched.then(callback);
  },
  once: function once(callback) {
    return this.fetched.then(callback);
  },
  get readyState() {
    return 'complete';
  },
  languages: getSupportedLanguages(),
  meta: meta,
  language: {
    code: 'en-US',
    direction: getDirection('en-US')
  },
  qps: {},
  observer: new MozL10nMutationObserver(),
  _config: {
    localeSources: Object.create(null),
    isPretranslated: false,
  },
  _getInternalAPI: function() {
    return {};
  }
};

function getDirection(lang) {
  return (rtlList.indexOf(lang) >= 0) ? 'rtl' : 'ltr';
}

export function init(pretranslate) {
  if (!pretranslate) {
    // initialize MO early to collect nodes injected between now and when
    // resources are loaded because we're not going to translate the whole
    // document once l10n resources are ready
    navigator.mozL10n.observer.start();
  }

  var resLinks = [];
  var nodes = document.head
                      .querySelectorAll('link[rel="localization"]');
  for (var i = 0, node; (node = nodes[i]); i++) {
    var link = node.getAttribute('href');
    resLinks.push(link);
  }

  this.documentView = this.env.createView(resLinks);
  initLocale.call(this);
}


function getMatchingLangpack(appVersion, langpacks) {
  for (var i = 0, langpack; (langpack = langpacks[i]); i++) {
    if (langpack.target === appVersion) {
      return langpack;
    }
  }
  return null;
}

function buildLocaleList(
    defaultLocale, bundledLanguages, extraLangs, appVersion) {
  var loc, lp;
  var localeSources = Object.create(null);

  for (loc in bundledLanguages) {
    localeSources[loc] = 'app';
  }

  if (extraLangs) {
    for (loc in extraLangs) {
      lp = getMatchingLangpack(appVersion, extraLangs[loc]);

      if (!lp) {
        continue;
      }
      if (!(loc in localeSources) ||
          !bundledLanguages[loc] ||
          parseInt(lp.revision) > bundledLanguages[loc]) {
        localeSources[loc] = 'extra';
      }
    }
  }

  if (!(defaultLocale in localeSources)) {
    localeSources[defaultLocale] = 'app';
  }
  return [defaultLocale, localeSources];
}

function splitAvailableLanguagesString(str) {
  var langs = {};

  str.split(',').forEach(function(lang) {
    // code:revision
    lang = lang.trim().split(':');
    // if revision is missing, use NaN
    langs[lang[0]] = parseInt(lang[1]);
  });
  return langs;
}

// XXX take last found instead of first?
// XXX optimize the number of qS?
function getAppVersion() {
  return interactive.then(function() {
    var meta = document.head.querySelector('meta[name="appVersion"]');
    return meta.getAttribute('content');
  });
}

function getDefaultLanguage() {
  return interactive.then(function() {
    var meta = document.head.querySelector('meta[name="defaultLanguage"]');
    return meta.getAttribute('content').trim();
  });
}

function getBundledLanguages() {
  return interactive.then(function() {
    var meta = document.head.querySelector('meta[name="availableLanguages"]');
    return splitAvailableLanguagesString(meta.getAttribute('content'));
  });
}

function getAvailableLanguages(extraLangs) {
  return Promise.all([
    meta.defaultLanguage,
    meta.bundledLanguages,
    extraLangs,
    meta.appVersion]).then(
      Function.prototype.apply.bind(buildLocaleList, null)).then(
        saveLocaleSources);
}

function saveLocaleSources(locales) {
  navigator.mozL10n._config.localeSources = locales[1];
  return Object.keys(locales[1]);
}

export function getSupportedLanguages() {
  return Promise.all([
    meta.defaultLanguage,
    navigator.mozApps.getAdditionalLanguages().then(getAvailableLanguages),
    navigator.languages || [navigator.language]]).then(
      Function.prototype.apply.bind(negotiate, null));
}

function negotiate(def, available, requested) {
  var supportedLocale;
  // Find the first locale in the requested list that is supported.
  for (var i = 0; i < requested.length; i++) {
    var locale = requested[i];
    if (available.indexOf(locale) !== -1) {
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
  this.fetched = this.documentView.fetch(navigator.mozL10n.languages, 1);
  return this.fetched.then(
    onReady.bind(this));
}

function onReady() {
  if (!this._config.isPretranslated) {
    this._config.isPretranslated = false;
    translateDocument.call(this).then(
      fireLocalizedEvent.bind(this));
  } else {
    fireLocalizedEvent.call(this);
  }

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
