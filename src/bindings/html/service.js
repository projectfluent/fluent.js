'use strict';

import { 
  translateDocument, setL10nAttributes, getL10nAttributes
} from './dom';
import MozL10nMutationObserver from './observer';

var rtlList = ['ar', 'he', 'fa', 'ps', 'qps-plocm', 'ur'];

// Public API

export const L10n = {
  env: null,
  ctxs: [],
  languages: null,
  observer: new MozL10nMutationObserver(),

  setAttributes: setL10nAttributes,
  getAttributes: getL10nAttributes,

  // legacy compat
  readyState: 'complete',
  language: {
    code: 'en-US',
    direction: getDirection('en-US')
  },
  qps: {},
  get: id => id,
  // XXX temporary
  _ready: new Promise(function(resolve) {
    window.addEventListener('l10nready', resolve);
  }),
  ready: function ready(callback) {
    return this._ready.then(callback);
  },
  once: function once(callback) {
    return this._ready.then(callback);
  }
};

function getDirection(lang) {
  return (rtlList.indexOf(lang) >= 0) ? 'rtl' : 'ltr';
}

export function fetchContexts() {
  return Promise.all(
    this.ctxs.map(ctx => ctx.fetch(this.languages, 1))).then(
      onReady.bind(this));
}

function onReady() {
  // XXX temporary
  dispatchEvent(window, 'l10nready');
  Promise.all(
    this.ctxs.map(ctx => translateDocument.call(ctx))).then(
      dispatchEvent.bind(this, window, 'localized'));
  // XXX when to start this?
  this.observer.start();
}

function dispatchEvent(root, name) {
  var event = new CustomEvent(name, {
    bubbles: false,
    cancelable: false,
    detail: {
      language: 'en-US'
    }
  });
  root.dispatchEvent(event);
}
