'use strict';

var Context = require('./context').Context;

var DEBUG = false;
var isPretranslated = false;
var rtlList = ['ar', 'he', 'fa', 'ps', 'ur'];

var ctx = new Context();
ctx.ready(onReady);

if (DEBUG) {
  ctx.addEventListener('error', logMessage.bind(null, 'error'));
  ctx.addEventListener('warning', logMessage.bind(null, 'warn'));
}


// Public API

navigator.mozL10n = {
  translate: translateFragment,
  localize: localizeElement,
  get: ctx.get.bind(ctx),
  ready: ctx.ready.bind(ctx),
  get readyState() {
    return ctx.isReady ? 'complete' : 'loading';
  },
  language: {
    set code(lang) {
      initLocale(lang, true);
    },
    get code() {
      return ctx.supportedLocales[0];
    },
    get direction() {
      return getDirection(ctx.supportedLocales[0]);
    }
  }
};

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

  if (isPretranslated) {
    waitFor('complete', function() {
      window.setTimeout(initDocumentLocalization);
    });
  } else {
    if (document.readyState === 'complete') {
      window.setTimeout(initDocumentLocalization);
    } else {
      waitFor('interactive', pretranslate);
    }
  }


}

function pretranslate() {
  if (inlineLocalization()) {
    waitFor('interactive', function() {
      window.setTimeout(initDocumentLocalization);
    });
  } else {
    initDocumentLocalization();
  }
}

function inlineLocalization() {
  var lang = navigator.language;
  var script = document.documentElement.querySelector('script[type="application/l10n"][lang="' +
      lang + '"]');
  if (!script) {
    return false;
  }
  var locale = ctx.getLocale(lang);
  // the inline localization is happenning very early, when the ctx is not
  // yet ready and when the resources haven't been downloaded yet;  add the
  // inlined JSON directly to the current locale
  locale.addAST(JSON.parse(script.innerHTML));
  // record the fact that the locale already has the inlined strings
  locale.isPartial = true;
  // localize the visible DOM
  translateFragment(null, locale);
  // the visible DOM is now pretranslated
  isPretranslated = true;
  return true;
}

function initDocumentLocalization() {
  var resLinks = document.head.querySelectorAll('link[type="application/l10n"]');
  var iniLinks = [];
  var link;

  for (link of resLinks) {
    var url = link.getAttribute('href');
    var type = url.substr(url.lastIndexOf('.') + 1);
    if (type === 'ini') {
      iniLinks.push(url);
    }
    ctx.resLinks.push(url);
  }

  var iniLoads = iniLinks.length;
  if (iniLoads === 0) {
    initLocale();
    return;
  }

  function onIniLoaded() {
    iniLoads--;
    if (iniLoads <= 0) {
      initLocale();
    }
  }

  for (link of iniLinks) {
    loadINI(link, onIniLoaded);
  }
}

function initLocale(lang) {
  if (!lang) {
    lang = navigator.language;
  }
  ctx.requestLocales(lang);
}

function onReady() {
  if (!isPretranslated) {
    translateFragment();
  }

  isPretranslated = false;
  fireLocalizedEvent();

  if (navigator.mozSettings) {
    navigator.mozSettings.addObserver('language.current', function(event) {
      navigator.mozL10n.language.code = event.settingValue;
    });
  }
}

function fireLocalizedEvent() {
  var event = document.createEvent('Event');
  event.initEvent('localized', false, false);
  event.language = ctx.supportedLocales[0];
  window.dispatchEvent(event);
}

function logMessage(type, e) {
  if (DEBUG) {
    console[type](e);
  }
}

// INI loader functions

function loadINI(url, cb) {
  io.load(url, function(err, source) {
    if (!source) {
      cb();
      return;
    }

    var ini = parseINI(source, url);
    var pos = ctx.resLinks.indexOf(url);

    var patterns = ini.resources.map(function(x) {
      return x.replace('en-US', '{{locale}}');
    });
    var args = [pos, 1].concat(patterns);
    ctx.resLinks.splice.apply(ctx.resLinks, args);
    cb();
  });
}

function relativePath(baseUrl, url) {
  if (url[0] === '/') {
    return url;
  }

  var dirs = baseUrl.split('/')
    .slice(0, -1)
    .concat(url.split('/'))
    .filter(function(path) {
      return path !== '.';
    });

  return dirs.join('/');
}

var iniPatterns = {
  'section': /^\s*\[(.*)\]\s*$/,
  'import': /^\s*@import\s+url\((.*)\)\s*$/i,
  'entry': /[\r\n]+/
};

function parseINI(source, iniPath) {
  var entries = source.split(iniPatterns.entry);
  var locales = ['en-US'];
  var genericSection = true;
  var uris = [];
  var match;

  for (var line of entries) {
    // we only care about en-US resources
    if (genericSection && iniPatterns['import'].test(line)) {
      match = iniPatterns['import'].exec(line);
      var uri = relativePath(iniPath, match[1]);
      uris.push(uri);
      continue;
    }

    // but we need the list of all locales in the ini, too
    if (iniPatterns.section.test(line)) {
      genericSection = false;
      match = iniPatterns.section.exec(line);
      locales.push(match[1]);
    }
  }
  return {
    locales: locales,
    resources: uris
  };
}

// HTML translation functions

function translateFragment(element, loc) {
  element = element || document.documentElement;


  translateElement(element, loc);
  
  for (var node of getTranslatableChildren(element)) {
    translateElement(node, loc);
  }
}

function getTranslatableChildren(element) {
  return element ? element.querySelectorAll('*[data-l10n-id]') : [];
}

function localizeElement(element, id, args) {
  if (!element) {
    return;
  }

  if (!id) {
    element.removeAttribute('data-l10n-id');
    element.removeAttribute('data-l10n-args');
    setTextContent(element, '');
    return;
  }

  element.setAttribute('data-l10n-id', id);
  if (args && typeof args === 'object') {
    element.setAttribute('data-l10n-args', JSON.stringify(args));
  } else {
    element.removeAttribute('data-l10n-args');
  }

  if (ctx.isReady) {
    translateElement(element);
  }
}

function getL10nAttributes(element) {
  if (!element) {
    return {};
  }

  var l10nId = element.getAttribute('data-l10n-id');
  var l10nArgs = element.getAttribute('data-l10n-args');

  var args = l10nArgs ? JSON.parse(l10nArgs) : null;

  return {id: l10nId, args: args};
}

function translateElement(element, loc) {
  var l10n = getL10nAttributes(element);

  if (!l10n.id) {
    return;
  }

  var entity;
  if (loc) {
    entity = loc.getEntity(l10n.id, l10n.args);
  } else {
    entity = ctx.getEntity(l10n.id, l10n.args);
  }

  if (!entity) {
    return;
  }

  if (typeof entity === 'string') {
    setTextContent(element, entity);
    return true;
  }

  if (entity.value) {
    setTextContent(element, entity.value);
  }

  if (entity.attributes) {
    for (var key in entity.attributes) {
      if (entity.attributes.hasOwnProperty(key)) {
        var attr = entity.attributes[key];
        var pos = key.indexOf('.');
        if (pos !== -1) {
          element[key.substr(0, pos)][key.substr(pos + 1)] = attr;
        } else if (key === 'ariaLabel') {
          element.setAttribute('aria-label', attr);
        } else {
          element[key] = attr;
        }
      }
    }
  }
  return true;
}

function setTextContent(element, text) {
  // standard case: no element children
  if (!element.firstElementChild) {
    element.textContent = text;
    return;
  }

  // this element has element children: replace the content of the first
  // (non-blank) child textNode and clear other child textNodes
  var found = false;
  var reNotBlank = /\S/;
  for (var child = element.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === 3 && reNotBlank.test(child.nodeValue)) {
      if (found) {
        child.nodeValue = '';
      } else {
        child.nodeValue = text;
        found = true;
      }
    }
  }
  // if no (non-empty) textNode is found, insert a textNode before the
  // element's first child.
  if (!found) {
    element.insertBefore(document.createTextNode(text), element.firstChild);
  }
}
