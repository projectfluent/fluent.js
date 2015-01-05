'use strict';

/* global Locale, Context, L10nError, Resolver, PropertiesParser */
/* global getPluralRule, rePlaceables */
/* global translateDocument, io */
/* global translateFragment, translateElement */
/* global setL10nAttributes, getL10nAttributes */
/* global walkContent, PSEUDO_STRATEGIES */

var DEBUG = false;
var isPretranslated = false;
var rtlList = ['ar', 'he', 'fa', 'ps', 'qps-plocm', 'ur'];
var nodeObserver = null;
var pendingElements = null;
var meta = {};

var moConfig = {
  attributes: true,
  characterData: false,
  childList: true,
  subtree: true,
  attributeFilter: ['data-l10n-id', 'data-l10n-args']
};

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
      walkContent: walkContent
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
  navigator.mozL10n.ctx.addEventListener('manifesterror',
    console.error.bind(console));
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
  if (pretranslate) {
    initResources.call(navigator.mozL10n);
  } else {
    // if pretranslate is false, we want to initialize MO
    // early, to collect nodes injected between now and when resources
    // are loaded because we're not going to translate the whole
    // document once l10n resources are ready.
    initObserver();
    window.setTimeout(initResources.bind(navigator.mozL10n));
  }
}

function initResources() {
  /* jshint boss:true */

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
        onMetaInjected.call(this, node);
        break;
      case 'script':
        onScriptInjected.call(this, node);
        break;
    }
  }

  if (!this.ctx.availableLocales.length) {
    // if there was no availableLanguages meta,
    // register the default locale only
    this.ctx.registerLocales(this.ctx.defaultLocale);
  }
  return initLocale.call(this);
}

function splitAvailableLanguagesString(str) {
  return str.split(',').map(function(lang) {
    lang = lang.trim().split(':');
    // if there are no timestamps, lang[0] will be the ab-CD
    return lang[0];
  });
}

function onMetaInjected(node) {
  if (this.ctx.availableLocales.length) {
    return;
  }

  switch (node.getAttribute('name')) {
    case 'availableLanguages':
      meta.availableLanguages = 
        splitAvailableLanguagesString(node.getAttribute('content'));
      break;
    case 'defaultLanguage':
      meta.defaultLanguage = node.getAttribute('content');
      break;
  }

  if (Object.keys(meta).length === 2) {
    this.ctx.registerLocales(meta.defaultLanguage, meta.availableLanguages);
    meta = {};
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
