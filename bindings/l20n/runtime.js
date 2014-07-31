'use strict';

/* global Entity, Locale, Context, L10nError */
/* global getPluralRule, rePlaceables, PropertiesParser, compile */
/* global translateDocument, loadINI */
/* global translateFragment, localizeElement, translateElement */
/* global setL10nAttributes, getL10nAttributes */
/* global getTranslatableChildren */
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

// Public API

navigator.mozL10n = {
  ctx: new Context(),
  get: function get(id, ctxdata) {
    return navigator.mozL10n.ctx.get(id, ctxdata);
  },
  localize: function localize(element, id, args) {
    return localizeElement.call(navigator.mozL10n, element, id, args);
  },
  translate: function () {
    // XXX: Remove after removing obsolete calls. Bugs 992473 and 1020136
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
  _getInternalAPI: function() {
    return {
      Error: L10nError,
      Context: Context,
      Locale: Locale,
      Entity: Entity,
      getPluralRule: getPluralRule,
      rePlaceables: rePlaceables,
      getTranslatableChildren:  getTranslatableChildren,
      translateDocument: translateDocument,
      loadINI: loadINI,
      fireLocalizedEvent: fireLocalizedEvent,
      PropertiesParser: PropertiesParser,
      compile: compile,
      walkContent: walkContent,
      PSEUDO_STRATEGIES: PSEUDO_STRATEGIES
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

function init(pretranslate) {
  nodeObserver = new MutationObserver(onMutations.bind(navigator.mozL10n));
  nodeObserver.observe(document, moConfig);

  if (pretranslate) {
    inlineLocalization.call(navigator.mozL10n);
  }
  window.setTimeout(initResources.bind(navigator.mozL10n));
}

function inlineLocalization() {
  var locale = this.ctx.getLocale(navigator.language);
  var scriptLoc = locale.isPseudo ? this.ctx.defaultLocale : locale.id;
  var script = document.documentElement
                       .querySelector('script[type="application/l10n"]' +
                       '[lang="' + scriptLoc + '"]');
  if (!script) {
    return;
  }

  // the inline localization is happenning very early, when the ctx is not
  // yet ready and when the resources haven't been downloaded yet;  add the
  // inlined JSON directly to the current locale
  locale.addAST(JSON.parse(script.innerHTML));
  // localize the visible DOM
  var l10n = {
    ctx: locale,
    language: {
      code: locale.id,
      direction: getDirection(locale.id)
    }
  };
  translateDocument.call(l10n);

  // the visible DOM is now pretranslated
  isPretranslated = true;
}

function initResources() {
  var resLinks = document.head
                         .querySelectorAll('link[type="application/l10n"]');
  var iniLinks = [];

  for (var i = 0; i < resLinks.length; i++) {
    var link = resLinks[i];
    var url = link.getAttribute('href');
    var type = url.substr(url.lastIndexOf('.') + 1);
    if (type === 'ini') {
      iniLinks.push(url);
    }
    this.ctx.resLinks.push(url);
  }

  var iniLoads = iniLinks.length;
  if (iniLoads === 0) {
    initLocale.call(this);
    return;
  }

  function onIniLoaded(err) {
    if (err) {
      this.ctx._emitter.emit('error', err);
    }
    if (--iniLoads === 0) {
      initLocale.call(this);
    }
  }

  for (i = 0; i < iniLinks.length; i++) {
    loadINI.call(this, iniLinks[i], onIniLoaded.bind(this));
  }
}

function initLocale() {
  this.ctx.requestLocales(navigator.language);
  window.addEventListener('languagechange', function l10n_langchange() {
    navigator.mozL10n.language.code = navigator.language;
  });
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
