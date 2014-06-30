'use strict';

/* global Entity, Locale, Context, L10nError */
/* global getPluralRule, rePlaceables, parse, compile */
/* global translateDocument, loadINI */
/* global translateFragment, localizeElement, translateElement */
/* global setL10nAttributes, getL10nAttributes */
/* global getTranslatableChildren */

var DEBUG = false;
var isPretranslated = false;
var rtlList = ['ar', 'he', 'fa', 'ps', 'qps-plocm', 'ur'];
var nodeObserver = false;

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
      parse: parse,
      compile: compile
    };
  }
};

