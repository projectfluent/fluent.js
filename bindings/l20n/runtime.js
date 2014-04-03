'use strict';

/* jshint -W104 */
/* global Locale, Context, rePlaceables */
/* global loadINI */
/* global translateFragment, localizeElement */
/* global getTranslatableChildren, getL10nAttributes */

var DEBUG = false;
var isPretranslated = false;
var rtlList = ['ar', 'he', 'fa', 'ps', 'ur'];

// Public API

navigator.mozL10n = {
  ctx: new Context(),
  get: function(id, ctxdata) {
    return navigator.mozL10n.ctx.get(id, ctxdata);
  },
  localize: localizeElement,
  translate: function translate(element) {
    return translateFragment(element);
  },
  ready: function(callback) {
    return navigator.mozL10n.ctx.ready(callback);
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
  _exposePrivateMethods: function() {
    this.Context = Context;
    this.Locale =  Locale;
    this.rePlaceables = rePlaceables;
    this.getTranslatableChildren = getTranslatableChildren;
    this.getL10nAttributes = getL10nAttributes;
    this.loadINI = loadINI;
    this.fireLocalizedEvent = fireLocalizedEvent;
  }
};

navigator.mozL10n.ctx.ready(onReady);

if (DEBUG) {
  navigator.mozL10n.ctx.addEventListener('error', createLogger('error'));
  navigator.mozL10n.ctx.addEventListener('warning', createLogger('warn'));
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
  isPretranslated = (document.documentElement.lang === navigator.language);

  // this is a special case for netError bug; see https://bugzil.la/444165
  if (document.documentElement.dataset.noCompleteBug) {
    pretranslate();
    return;
  }


  if (isPretranslated) {
    waitFor('complete', function() {
      window.setTimeout(initResources);
    });
  } else {
    if (document.readyState === 'complete') {
      window.setTimeout(initResources);
    } else {
      waitFor('interactive', pretranslate);
    }
  }

}

function pretranslate() {
  if (inlineLocalization()) {
    waitFor('interactive', function() {
      window.setTimeout(initResources);
    });
  } else {
    initResources();
  }
}

function inlineLocalization() {
  var script = document.documentElement
                       .querySelector('script[type="application/l10n"]' +
                       '[lang="' + navigator.language + '"]');
  if (!script) {
    return false;
  }

  var locale = navigator.mozL10n.ctx.getLocale(navigator.language);
  // the inline localization is happenning very early, when the ctx is not
  // yet ready and when the resources haven't been downloaded yet;  add the
  // inlined JSON directly to the current locale
  locale.addAST(JSON.parse(script.innerHTML));
  // localize the visible DOM
  translateFragment(null, locale);
  // the visible DOM is now pretranslated
  isPretranslated = true;
  return true;
}

function initResources() {
  var resLinks = document.head
                         .querySelectorAll('link[type="application/l10n"]');
  var iniLinks = [];
  var link;

  for (link of resLinks) {
    var url = link.getAttribute('href');
    var type = url.substr(url.lastIndexOf('.') + 1);
    if (type === 'ini') {
      iniLinks.push(url);
    }
    navigator.mozL10n.ctx.resLinks.push(url);
  }

  var iniLoads = iniLinks.length;
  if (iniLoads === 0) {
    initLocale();
    return;
  }

  function onIniLoaded(err) {
    if (err) {
      navigator.mozL10n.ctx._emitter.emit('error', err);
    }
    if (--iniLoads === 0) {
      initLocale();
    }
  }

  for (link of iniLinks) {
    loadINI(link, onIniLoaded);
  }
}

function initLocale() {
  navigator.mozL10n.ctx.requestLocales(navigator.language);
  // mozSettings won't be required here when https://bugzil.la/780953 lands
  if (navigator.mozSettings) {
    navigator.mozSettings.addObserver('language.current', function(event) {
      navigator.mozL10n.language.code = event.settingValue;
    });
  }
}

function onReady() {
  if (!isPretranslated) {
    translateFragment();
  }
  isPretranslated = false;

  fireLocalizedEvent();
}

function fireLocalizedEvent() {
  var event = document.createEvent('Event');
  event.initEvent('localized', false, false);
  event.language = navigator.mozL10n.ctx.supportedLocales[0];
  window.dispatchEvent(event);
}

function createLogger(type) {
  if (DEBUG) {
    return console[type];
  } else {
    return function() {};
  }
}
