'use strict';

import { 
  translateDocument, setL10nAttributes, getL10nAttributes
} from './dom';

export const L10n = {
  views: [],
  env: null,
  languages: null,
  setAttributes: setL10nAttributes,
  getAttributes: getL10nAttributes,
};

export function initViews(langs) {
  return Promise.all(
    this.views.map(view => initView(view, langs)));
}

function initView(view, langs) {
  dispatchEvent(view.doc, 'supportedlanguageschange', langs);
  return view.ctx.fetch(langs, 1).then(
    translateDocument.bind(view, view.doc.documentElement, langs)).then(
      () => {
        dispatchEvent.bind(this, view.doc, 'DOMLocalized', langs);
        view.observer.start();
      });
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
