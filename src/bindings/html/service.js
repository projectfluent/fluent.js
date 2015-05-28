'use strict';

import { translateDocument } from './dom';

export const L10n = {
  views: [],
  env: null,
  languages: null
};

export function initViews(langs) {
  return Promise.all(
    this.views.map(view => initView(view, langs)));
}

function initView(view, langs) {
  dispatchEvent(view.doc, 'supportedlanguageschange', langs);
  return view.ctx.fetch(langs, 1).then(
    translateDocument.bind(view, view.doc, langs)).then(
      () => view.observer.start());
}

export function dispatchEvent(root, name, langs) {
  var event = new CustomEvent(name, {
    bubbles: false,
    cancelable: false,
    detail: {
      languages: langs
    }
  });
  root.dispatchEvent(event);
}
