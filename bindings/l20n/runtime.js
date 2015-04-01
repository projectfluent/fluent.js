'use strict';

/* global Locale, Context, L10nError, Resolver, PropertiesParser */
/* global getPluralRule, rePlaceables */
/* global translateDocument, Promise */
/* global translateFragment */
/* global setL10nAttributes, getL10nAttributes */
/* global walkContent, PSEUDO */
/* global MozL10nMutationObserver */

var DEBUG = false;
var isPretranslated = false;
var rtlList = ['ar', 'he', 'fa', 'ps', 'qps-plocm', 'ur'];


// Public API

navigator.mozL10n = {
  ctx: new Context(window.document ? document.URL : null),
  get: function get(id) {
    return id;
  },
  formatValue: function(id, ctxdata) {
    return navigator.mozL10n.ctx.formatValue(id, ctxdata);
  },
  formatEntity: function(id, ctxdata) {
    return navigator.mozL10n.ctx.formatEntity(id, ctxdata);
  },
  translateFragment: function (fragment) {
    return translateFragment.call(navigator.mozL10n, fragment);
  },
  setAttributes: setL10nAttributes,
  getAttributes: getL10nAttributes,
  ready: function ready(callback) {
    return navigator.mozL10n.ctx.ready(callback);
  },
  once: function once(callback) {
    return navigator.mozL10n.ctx.once(callback);
  },
  get readyState() {
    return navigator.mozL10n.ctx.isReady ? 'complete' : 'loading';
  },
  language: {
    set code(lang) {
      navigator.mozL10n.ctx.requestLocales(lang);
    },
    get code() {
      return navigator.mozL10n.ctx.supportedLocales[0];
    },
    get direction() {
      return getDirection(navigator.mozL10n.ctx.supportedLocales[0]);
    }
  },
  qps: PSEUDO,
  observer: new MozL10nMutationObserver(),
  _config: {
    appVersion: null,
    localeSources: Object.create(null),
  },
  _getInternalAPI: function() {
    return {
      Error: L10nError,
      Context: Context,
      Locale: Locale,
      Resolver: Resolver,
      getPluralRule: getPluralRule,
      rePlaceables: rePlaceables,
      translateDocument: translateDocument,
      PropertiesParser: PropertiesParser,
      walkContent: walkContent,
      buildLocaleList: buildLocaleList
    };
  }
};

navigator.mozL10n.ctx.ready(onReady.bind(navigator.mozL10n));

navigator.mozL10n.ctx.addEventListener('notfounderror',
  function reportMissingEntity(e) {
    if (DEBUG || e.loc === 'en-US') {
      console.warn(e.toString());
    }
});

if (DEBUG) {
  navigator.mozL10n.ctx.addEventListener('fetcherror',
    console.error.bind(console));
  navigator.mozL10n.ctx.addEventListener('parseerror',
    console.error.bind(console));
  navigator.mozL10n.ctx.addEventListener('resolveerror',
    console.error.bind(console));
}

function getDirection(lang) {
  return (rtlList.indexOf(lang) >= 0) ? 'rtl' : 'ltr';
}

var readyStates = {
  'loading': 0,
  'interactive': 1,
  'complete': 2
};

function waitFor(state, callback) {
  state = readyStates[state];
  if (readyStates[document.readyState] >= state) {
    callback();
    return;
  }

  document.addEventListener('readystatechange', function l10n_onrsc() {
    if (readyStates[document.readyState] >= state) {
      document.removeEventListener('readystatechange', l10n_onrsc);
      callback();
    }
  });
}

if (window.document) {
  isPretranslated =
    document.documentElement.lang === navigator.language;

  // XXX always pretranslate if data-no-complete-bug is set;  this is
  // a workaround for a netError page not firing some onreadystatechange
  // events;  see https://bugzil.la/444165
  var pretranslate = document.documentElement.dataset.noCompleteBug ?
    true : !isPretranslated;
  waitFor('interactive', init.bind(navigator.mozL10n, pretranslate));
}

function init(pretranslate) {
  if (!pretranslate) {
    // initialize MO early to collect nodes injected between now and when
    // resources are loaded because we're not going to translate the whole
    // document once l10n resources are ready
    navigator.mozL10n.observer.start();
  }

  var nodes = document.head
                      .querySelectorAll('link[rel="localization"]');
  for (var i = 0, node; (node = nodes[i]); i++) {
    this.ctx.resLinks.push(node.getAttribute('href'));
  }

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

function buildLocaleList(extraLangs) {
  var loc, lp;
  var localeSources = Object.create(null);
  var defaultLocale = getDefaultLanguage();

  var bundledLanguages = getBundledLanguages();

  for (loc in bundledLanguages) {
    localeSources[loc] = 'app';
  }

  if (extraLangs) {
    for (loc in extraLangs) {
      lp = getMatchingLangpack(getAppVersion(), extraLangs[loc]);

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
  var meta = document.head.querySelector('meta[name="appVersion"]');
  return navigator.mozL10n._config.appVersion = meta.getAttribute('content');
}

function getDefaultLanguage() {
  var meta = document.head.querySelector('meta[name="defaultLanguage"]');
  return meta.getAttribute('content').trim();
}

function getBundledLanguages() {
  var meta = document.head.querySelector('meta[name="availableLanguages"]');
  return splitAvailableLanguagesString(meta.getAttribute('content'));
}

function getAdditionalLanguages() {
  if (navigator.mozApps && navigator.mozApps.getAdditionalLanguages) {
    return navigator.mozApps.getAdditionalLanguages().catch(function(e) {
        console.error('Error while loading getAdditionalLanguages', e);
      });
  } else {
    return Promise.resolve();
  }
}

function getAvailableLanguages(extraLangs) {
  var locales = buildLocaleList(extraLangs);
  navigator.mozL10n._config.localeSources = locales[1];
  return Object.keys(locales[1]);
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


function initLocale() {
  var langs = Promise.all([
    getDefaultLanguage(),
    getAdditionalLanguages().then(getAvailableLanguages),
    navigator.languages || [navigator.language]]).then(
      Function.prototype.apply.bind(negotiate, null));
  this.ctx.fetch(langs, 1);
}

function onReady() {
  if (!isPretranslated) {
    isPretranslated = false;
    translateDocument.call(this).then(
      fireLocalizedEvent.bind(this));
  } else {
    fireLocalizedEvent.call(this);
  }

  this.observer.start();
}

function fireLocalizedEvent() {
  var event = new CustomEvent('localized', {
    'bubbles': false,
    'cancelable': false,
    'detail': {
      'language': this.ctx.supportedLocales[0]
    }
  });
  window.dispatchEvent(event);
}
