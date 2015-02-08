'use strict';

/* global Locale, Context, L10nError, Resolver, PropertiesParser */
/* global getPluralRule, rePlaceables */
/* global translateDocument, Promise */
/* global translateFragment, translateElement */
/* global setL10nAttributes, getL10nAttributes */
/* global walkContent, PSEUDO_STRATEGIES */

var DEBUG = false;
var isPretranslated = false;
var rtlList = ['ar', 'he', 'fa', 'ps', 'qps-plocm', 'ur'];
var nodeObserver = null;
var pendingElements = null;

var moConfig = {
  attributes: true,
  characterData: false,
  childList: true,
  subtree: true,
  attributeFilter: ['data-l10n-id', 'data-l10n-args']
};

var Gecko2GaiaVersions = {
  '37.0': '2.2',
  '38.0': '3.0'
};

function getGaiaVersion() {
  if (!navigator.userAgent) {
    return undefined;
  }

  var match = /rv\:([0-9\.]+)/.exec(navigator.userAgent);
  if (!match) {
    return undefined;
  }
  if (match[1] in Gecko2GaiaVersions) {
    return Gecko2GaiaVersions[match[1]];
  }
  return undefined;
}

// Public API

navigator.mozL10n = {
  ctx: new Context(window.document ? document.URL : null),
  get: function get(id, ctxdata) {
    return navigator.mozL10n.ctx.get(id, ctxdata);
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
  qps: PSEUDO_STRATEGIES,
  _config: {
    gaiaVersion: getGaiaVersion(),
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
      onMetaInjected: onMetaInjected,
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
  isPretranslated = !PSEUDO_STRATEGIES.hasOwnProperty(navigator.language) &&
                    (document.documentElement.lang === navigator.language);

  // XXX always pretranslate if data-no-complete-bug is set;  this is
  // a workaround for a netError page not firing some onreadystatechange
  // events;  see https://bugzil.la/444165
  var pretranslate = document.documentElement.dataset.noCompleteBug ?
    true : !isPretranslated;
  waitFor('interactive', init.bind(navigator.mozL10n, pretranslate));
}

function initObserver() {
  nodeObserver = new MutationObserver(onMutations.bind(navigator.mozL10n));
  nodeObserver.observe(document, moConfig);
}

function init(pretranslate) {
  if (!pretranslate) {
    // initialize MO early to collect nodes injected between now and when
    // resources are loaded because we're not going to translate the whole
    // document once l10n resources are ready
    initObserver();
  }
  initResources.call(navigator.mozL10n);
}

function initResources() {
  /* jshint boss:true */

  var meta = {};
  var nodes = document.head
                      .querySelectorAll('link[rel="localization"],' +
                                        'meta[name="availableLanguages"],' +
                                        'meta[name="defaultLanguage"],' +
                                        'script[type="application/l10n"]');
  for (var i = 0, node; node = nodes[i]; i++) {
    var type = node.getAttribute('rel') || node.nodeName.toLowerCase();
    switch (type) {
      case 'localization':
        this.ctx.resLinks.push(node.getAttribute('href'));
        break;
      case 'meta':
        onMetaInjected.call(this, node, meta);
        break;
      case 'script':
        onScriptInjected.call(this, node);
        break;
    }
  }

  var additionalLanguagesPromise;

  if (navigator.mozApps && navigator.mozApps.getAdditionalLanguages) {
    // if the environment supports langpacks, register extra languages…
    additionalLanguagesPromise =
      navigator.mozApps.getAdditionalLanguages().catch(function(e) {
        console.error('Error while loading getAdditionalLanguages', e);
      });

    // …and listen to langpacks being added and removed
    document.addEventListener('additionallanguageschange', function(evt) {
      registerLocales.call(this, meta, evt.detail);
    }.bind(this));
  } else {
    additionalLanguagesPromise = Promise.resolve();
  }

  additionalLanguagesPromise.then(function(extraLangs) {
    registerLocales.call(this, meta, extraLangs);
    initLocale.call(this);
  }.bind(this));
}

function registerLocales(meta, extraLangs) {
  var locales = buildLocaleList.call(this, meta, extraLangs);
  navigator.mozL10n._config.localeSources = locales[1];
  this.ctx.registerLocales(locales[0], Object.keys(locales[1]));
}

function getMatchingLangpack(lpVersions) {
  for (var i in lpVersions) {
    if (lpVersions[i].target === navigator.mozL10n._config.gaiaVersion) {
      return lpVersions[i];
    }
  }
  return null;
}

function buildLocaleList(meta, extraLangs) {
  var loc, lp;
  var localeSources = Object.create(null);
  var defaultLocale = meta.defaultLocale || this.ctx.defaultLocale;

  if (meta.availableLanguages) {
    for (loc in meta.availableLanguages) {
      localeSources[loc] = 'app';
    }
  }

  if (extraLangs) {
    for (loc in extraLangs) {
      lp = getMatchingLangpack(extraLangs[loc]);

      if (!lp) {
        continue;
      }
      if (!(loc in localeSources) ||
          !meta.availableLanguages[loc] ||
          parseInt(lp.version) > meta.availableLanguages[loc]) {
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
    lang = lang.trim().split(':');
    langs[lang[0]] = lang[1];
  });
  return langs;
}

function onMetaInjected(node, meta) {
  switch (node.getAttribute('name')) {
    case 'availableLanguages':
      meta.availableLanguages =
        splitAvailableLanguagesString(node.getAttribute('content'));
      break;
    case 'defaultLanguage':
      meta.defaultLanguage = node.getAttribute('content');
      break;
  }
}

function onScriptInjected(node) {
  var lang = node.getAttribute('lang');
  var locale = this.ctx.getLocale(lang);
  locale.addAST(JSON.parse(node.textContent));
}

function initLocale() {
  this.ctx.requestLocales.apply(
    this.ctx, navigator.languages || [navigator.language]);
  window.addEventListener('languagechange', function l10n_langchange() {
    this.ctx.requestLocales.apply(
      this.ctx, navigator.languages || [navigator.language]);
  }.bind(this));
}

function localizeMutations(mutations) {
  var mutation;
  var targets = new Set();

  for (var i = 0; i < mutations.length; i++) {
    mutation = mutations[i];
    if (mutation.type === 'childList') {
      var addedNode;

      for (var j = 0; j < mutation.addedNodes.length; j++) {
        addedNode = mutation.addedNodes[j];
        if (addedNode.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }
        targets.add(addedNode);
      }
    }

    if (mutation.type === 'attributes') {
      targets.add(mutation.target);
    }
  }

  targets.forEach(function(target) {
    if (target.childElementCount) {
      translateFragment.call(this, target);
    } else if (target.hasAttribute('data-l10n-id')) {
      translateElement.call(this, target);
    }
  }, this);
}

function onMutations(mutations, self) {
  self.disconnect();
  localizeMutations.call(this, mutations);
  self.observe(document, moConfig);
}

function onReady() {
  if (!isPretranslated) {
    translateDocument.call(this);
  }
  isPretranslated = false;

  if (pendingElements) {
    /* jshint boss:true */
    for (var i = 0, element; element = pendingElements[i]; i++) {
      translateElement.call(this, element);
    }
    pendingElements = null;
  }

  if (!nodeObserver) {
    initObserver();
  }
  fireLocalizedEvent.call(this);
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
