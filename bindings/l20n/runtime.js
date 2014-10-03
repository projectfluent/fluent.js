'use strict';

/* global Entity, Locale, Context, L10nError */
/* global getPluralRule, rePlaceables, PropertiesParser, compile */
/* global translateDocument, io */
/* global translateFragment, localizeElement, translateElement */
/* global setL10nAttributes, getL10nAttributes */
/* global walkContent, PSEUDO_STRATEGIES */

var DEBUG = false;
var isPretranslated = false;
var rtlList = ['ar', 'he', 'fa', 'ps', 'qps-plocm', 'ur'];
var nodeObserver = null;
var pendingElements = null;
var manifest = {};

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
  localize: function localize(element, id, args) {
    return localizeElement.call(navigator.mozL10n, element, id, args);
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
      Entity: Entity,
      getPluralRule: getPluralRule,
      rePlaceables: rePlaceables,
      translateDocument: translateDocument,
      onManifestInjected: onManifestInjected,
      onMetaInjected: onMetaInjected,
      PropertiesParser: PropertiesParser,
      compile: compile,
      walkContent: walkContent
    };
  }
};

navigator.mozL10n.ctx.ready(onReady.bind(navigator.mozL10n));

if (DEBUG) {
  navigator.mozL10n.ctx.addEventListener('error', console.error);
  navigator.mozL10n.ctx.addEventListener('warning', console.warn);
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
  var manifestFound = false;

  var nodes = document.head
                      .querySelectorAll('link[rel="localization"],' +
                                        'link[rel="manifest"],' +
                                        'meta[name="locales"],' +
                                        'meta[name="default_locale"],' +
                                        'script[type="application/l10n"]');
  for (var i = 0, node; node = nodes[i]; i++) {
    var type = node.getAttribute('rel') || node.nodeName.toLowerCase();
    switch (type) {
      case 'manifest':
        manifestFound = true;
        onManifestInjected.call(this, node.getAttribute('href'), initLocale);
        break;
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

  // if after scanning the head any locales have been registered in the ctx
  // it's safe to initLocale without waiting for manifest.webapp
  if (this.ctx.availableLocales.length) {
    return initLocale.call(this);
  }

  // if no locales were registered so far and no manifest.webapp link was
  // found we still call initLocale with just the default language available
  if (!manifestFound) {
    this.ctx.registerLocales(this.ctx.defaultLocale);
    return initLocale.call(this);
  }
}

function onMetaInjected(node) {
  if (this.ctx.availableLocales.length) {
    return;
  }

  switch (node.getAttribute('name')) {
    case 'locales':
      manifest.locales = node.getAttribute('content').split(',').map(
        Function.prototype.call, String.prototype.trim);
      break;
    case 'default_locale':
      manifest.defaultLocale = node.getAttribute('content');
      break;
  }

  if (Object.keys(manifest).length === 2) {
    this.ctx.registerLocales(manifest.defaultLocale, manifest.locales);
    manifest = {};
  }
}

function onScriptInjected(node) {
  var lang = node.getAttribute('lang');
  var locale = this.ctx.getLocale(lang);
  locale.addAST(JSON.parse(node.textContent));
}

function onManifestInjected(url, callback) {
  if (this.ctx.availableLocales.length) {
    return;
  }

  io.loadJSON(url, function parseManifest(err, json) {
    if (this.ctx.availableLocales.length) {
      return;
    }

    if (err) {
      this.ctx._emitter.emit('error', err);
      this.ctx.registerLocales(this.ctx.defaultLocale);
      if (callback) {
        callback.call(this);
      }
      return;
    }

    // default_locale and locales might have been already provided by meta
    // elements which take precedence;  check if we already have them
    if (!('defaultLocale' in manifest)) {
      if (json.default_locale) {
        manifest.defaultLocale = json.default_locale;
      } else {
        manifest.defaultLocale = this.ctx.defaultLocale;
        this.ctx._emitter.emit(
          'warning', new L10nError('default_locale missing from manifest'));
      }
    }
    if (!('locales' in manifest)) {
      if (json.locales) {
        manifest.locales = Object.keys(json.locales);
      } else {
        this.ctx._emitter.emit(
          'warning', new L10nError('locales missing from manifest'));
      }
    }

    this.ctx.registerLocales(manifest.defaultLocale, manifest.locales);
    manifest = {};

    if (callback) {
      callback.call(this);
    }
  }.bind(this));
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

  for (var i = 0; i < mutations.length; i++) {
    mutation = mutations[i];
    if (mutation.type === 'childList') {
      var addedNode;

      for (var j = 0; j < mutation.addedNodes.length; j++) {
        addedNode = mutation.addedNodes[j];

        if (addedNode.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }

        if (addedNode.childElementCount) {
          translateFragment.call(this, addedNode);
        } else if (addedNode.hasAttribute('data-l10n-id')) {
          translateElement.call(this, addedNode);
        }
      }
    }

    if (mutation.type === 'attributes') {
      translateElement.call(this, mutation.target);
    }
  }
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
