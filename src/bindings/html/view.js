'use strict';

import { qps } from '../../lib/pseudo';
import { getResourceLinks, documentReady } from './head';
import {
  setAttributes, getAttributes, translateFragment, translateMutations
} from './dom';

const observerConfig = {
  attributes: true,
  characterData: false,
  childList: true,
  subtree: true,
  attributeFilter: ['data-l10n-id', 'data-l10n-args']
};

export class View {
  constructor(client, doc) {
    this.doc = doc;
    this.qps = qps;

    this.interactive = documentReady().then(
      () => init(this, client));

    this.ready = new Promise(function(resolve) {
      const viewReady = function(evt) {
        doc.removeEventListener('DOMLocalized', viewReady);
        resolve(evt.detail.languages);
      };
      doc.addEventListener('DOMLocalized', viewReady);
    });

    const observer = new MutationObserver(onMutations.bind(this));
    this.observe = () => observer.observe(this.doc, observerConfig);
    this.disconnect = () => observer.disconnect();

    this.resolvedLanguages().then(
      langs => translateDocument(this, langs));
  }

  resolvedLanguages() {
    return this.interactive.then(
      client => client.languages);
  }

  requestLanguages(langs) {
    return this.interactive.then(
      client => client.requestLanguages(langs));
  }

  _resolveEntities(langs, keys) {
    return this.interactive.then(
      client => client.resolveEntities(this, langs, keys));
  }

  formatValue(id, args) {
    return this.interactive.then(
      client => client.formatValues(this, [[id, args]])).then(
        values => values[0]);
  }

  formatValues(...keys) {
    return this.interactive.then(
      client => client.formatValues(this, keys));
  }

  translateFragment(frag) {
    return this.resolvedLanguages().then(
      langs => translateFragment(this, langs, frag));
  }
}

View.prototype.setAttributes = setAttributes;
View.prototype.getAttributes = getAttributes;

function init(view, client) {
  view.observe();
  return client.registerView(view, getResourceLinks(view.doc.head)).then(
    () => client);
}

function onMutations(mutations) {
  return this.resolvedLanguages().then(
    langs => translateMutations(this, langs, mutations));
}

export function translateDocument(view, langs) {
  const doc = view.doc;

  if (langs[0].code === doc.documentElement.getAttribute('lang')) {
    return Promise.resolve().then(
      () => dispatchEvent(doc, 'DOMLocalized', langs));
  }

  return translateFragment(view, langs, doc.documentElement).then(
    () => {
      doc.documentElement.lang = langs[0].code;
      doc.documentElement.dir = langs[0].dir;
      dispatchEvent(doc, 'DOMLocalized', langs);
    });
}

function dispatchEvent(root, name, langs) {
  const event = new CustomEvent(name, {
    bubbles: false,
    cancelable: false,
    detail: {
      languages: langs
    }
  });
  root.dispatchEvent(event);
}
