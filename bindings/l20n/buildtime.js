'use strict';

var Context = require('./context').Context;
var rePlaceables = require('./compiler').rePlaceables;

var DEBUG = true;
var rtlList = ['ar', 'he', 'fa', 'ps', 'ur'];

var ctx;

// Public API

navigator.mozL10n = {
  translate: translateFragment,
  localize: localizeElement,
  get: function(id, ctxdata){
    return ctx.get(id, ctxdata);
  },
  ready: function(callback){
    return ctx.ready(callback);
  },
  get readyState() {
    return ctx.isReady ? 'complete' : 'loading';
  },
  language: {
    set code(lang) {
      ctx.requestLocales(lang);
    },
    get code() {
      return ctx.supportedLocales[0];
    },
    get direction() {
      return getDirection(ctx.supportedLocales[0]);
    },
  },
  getDictionary: getDictionary,
  bootstrap: bootstrap
};


function bootstrap(callback) {
  ctx = new Context();
  ctx.isBuildtime = true;
  ctx.ready(onReady);

  if (DEBUG) {
    ctx.addEventListener('error', addBuildMessage.bind(null, 'error'));
    ctx.addEventListener('warning', addBuildMessage.bind(null, 'warn'));
  }
  initDocumentLocalization(callback);
}

function getDirection(lang) {
  return (rtlList.indexOf(lang) >= 0) ? 'rtl' : 'ltr';
}

function initDocumentLocalization(callback) {
  if (!callback) {
    callback = ctx.requestLocales.bind(ctx, navigator.language);
  }
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
    callback();
    return;
  }

  function onIniLoaded() {
    iniLoads--;
    if (iniLoads <= 0) {
      callback();
    }
  }

  for (link of iniLinks) {
    loadINI(link, onIniLoaded);
  }
}

function onReady() {
  translateFragment();
  fireLocalizedEvent();
}

var buildMessages = {};

function addBuildMessage(type, e) {
  if (!(type in buildMessages)) {
    buildMessages[type] = [];
  }
  if (e instanceof Context.TranslationError &&
      e.locale === ctx.supportedLocales[0] &&
      buildMessages[type].indexOf(e.entity) === -1) {
        buildMessages[type].push(e.entity);
      }
}

function flushBuildMessages(variant) {
  for (var type in buildMessages) {
    if (buildMessages[type].length) {
      console.log('[l10n] [' + ctx.supportedLocales[0] + ']: ' +
          buildMessages[type].length + ' missing ' + variant + ': ' +
          buildMessages[type].join(', '));
      buildMessages[type] = [];
    }
  }
}


/* API for webapp-optimize */

Context.prototype.getEntitySource = function getEntitySource(id) {
  if (!this.isReady) {
    throw new Context.Error('Context not ready');
  }
  var cur = 0;
  var loc;
  var locale;
  while (loc = this.supportedLocales[cur]) {
    locale = this.getLocale(loc);
    if (!locale.isReady) {
      // build without callback, synchronously
      locale.build(null);
    }
    if (locale.ast && locale.ast.hasOwnProperty(id)) {
      return locale.ast[id];
    }
    var e = new Context.TranslationError('Not found', id,
        this.supportedLocales, locale);
    this._emitter.emit('warning', e);
    cur++;
  }
  return '';
}

// return an array of all {{placeables}} found in a string
function getPlaceableNames(str) {
  var placeables = [];
  var match;
  while (match = rePlaceables.exec(str)) {
    placeables.push(match[1]);
  }
  return placeables;
}

// recursively walk an entity and put all dependencies required for string
// interpolation in the AST
function getPlaceables(ast, val) {
  if (typeof val === 'string') {
    var placeables = getPlaceableNames(val);
    for (var i = 0; i < placeables.length; i++) {
      var id = placeables[i];
      ast[id] = ctx.getEntitySource(id);
    }
  } else {
    for (var prop in val) {
      if (!val.hasOwnProperty(prop) || val === '_index') {
        continue;
      }
      getPlaceables(ast, val[prop]);
    }
  }
}

function getDictionary(fragment) {
  var ast = {};

  if (!fragment) {
    var sourceLocale = ctx.getLocale('en-US');
    if (!sourceLocale.isReady) {
      sourceLocale.build(null);
    }
    // iterate over all strings in en-US
    for (var id in sourceLocale.ast) {
      ast[id] = ctx.getEntitySource(id);
    }
    return ast;
  }

  var elements = getTranslatableChildren(fragment);

  for (var i = 0; i < elements.length; i++) {
    var attrs = getL10nAttributes(elements[i]);
    var val = ctx.getEntitySource(attrs.id);
    ast[attrs.id] = val;
    getPlaceables(ast, val);
  }
  return ast;
};


/* DOM translation functions */

function fireLocalizedEvent() {
  var event = document.createEvent('Event');
  event.initEvent('localized', false, false);
  event.language = ctx.supportedLocales[0];
  window.dispatchEvent(event);
}
