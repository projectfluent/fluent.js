'use strict';

import { 
  translateDocument, setL10nAttributes, getL10nAttributes
} from './dom';

export const L10n = {
  env: null,
  views: [],
  languages: null,

  setAttributes: setL10nAttributes,
  getAttributes: getL10nAttributes,

  // legacy compat
  readyState: 'complete',
  language: {
    code: 'en-US',
    direction: 'ltr'
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

export function initViews(langs) {
  return Promise.all(
    this.views.map(view => initView(view, langs))).then(
      onReady.bind(this)).catch(console.error.bind.console);
}

function initView(view, langs) {
  dispatchEvent(view.doc, 'supportedlanguageschange', langs);
  return view.ctx.fetch(langs, 1);
}

function onReady() {
  // XXX temporary
  dispatchEvent(window, 'l10nready');

  function translate(view) {
    return translateDocument.call(view, view.doc.documentElement).then(
      () => view.observer.start());
  } 

  Promise.all(
    this.views.map(view => translate(view))).then(
      dispatchEvent.bind(this, window, 'localized'));
}

function dispatchEvent(root, name, langs) {
  var event = new CustomEvent(name, {
    bubbles: false,
    cancelable: false,
    detail: {
      languages: langs
    }
  });
  root.dispatchEvent(event);
}
