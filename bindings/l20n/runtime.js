'use strict';

var Context = require('./context').Context;

var isPretranslated = false;
var rtlList = ['ar', 'he', 'fa', 'ps', 'ur'];

var ctx = new Context();

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
      window.setTimeout(initDocumentLocalization.bind(null, initLocale));
    });
  } else {
    initDocumentLocalization(initLocale);
  }
}

function initDocumentLocalization(cb) {
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
    onIniLoaded();
  }

  function onIniLoaded() {
    iniLoads--;
    if (iniLoads <= 0) {
      cb();
    }
  }

  for (link of iniLinks) {
    loadINI(link, onIniLoaded);
  }
}

function initLocale(lang, forced) {
  ctx.ready(onReady.bind(null, forced));
  ctx.registerLocales('en-US');
  ctx.requestLocales(navigator.language);
}

function onReady(forced) {
  if (forced || !isPretranslated) {
    translateFragment();
  }
  fireLocalizedEvent();
}

function fireLocalizedEvent() {
  var event = document.createEvent('Event');
  event.initEvent('localized', false, false);
  event.language = ctx.supportedLocales[0];
  window.dispatchEvent(event);
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

function translateFragment(element) {
  element = element || document.documentElement;

  translateElement(element);
  var nodes = getTranslatableChildren(element);
  for (var node of nodes) {
    translateElement(node);
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

  var args = {};
  if (l10nArgs) {
    args = JSON.parse(l10nArgs);
  }
  return {id: l10nId, args: args};
}

function translateElement(element) {
  var l10n = getL10nAttributes(element);
  if (!l10n.id) {
    return;
  }

  var entity = ctx.getEntity(l10n.id, l10n.args);
  if (!entity) {
    console.log(l10n);
    console.dir(entity);
  }

  if (entity.value) {
    setTextContent(element, entity.value);
  }

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
