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

const readiness = new WeakMap();

export class View {
  constructor(client, doc) {
    this._doc = doc;
    this.qps = qps;

    this._interactive = documentReady().then(
      () => init(this, client));

    const observer = new MutationObserver(onMutations.bind(this));
    this._observe = () => observer.observe(doc, observerConfig);
    this._disconnect = () => observer.disconnect();

    this.ready = this.resolvedLanguages().then(
      langs => translateDocument(this, langs));
  }

  resolvedLanguages() {
    return this._interactive.then(
      client => client.languages);
  }

  requestLanguages(langs) {
    return this._interactive.then(
      client => client.requestLanguages(langs));
  }

  _resolveEntities(langs, keys) {
    return this._interactive.then(
      client => client.resolveEntities(this, langs, keys));
  }

  formatValue(id, args) {
    return this._interactive.then(
      client => client.formatValues(this, [[id, args]])).then(
        values => values[0]);
  }

  formatValues(...keys) {
    return this._interactive.then(
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
  view._observe();
  return client.registerView(view, getResourceLinks(view._doc.head)).then(
    () => client);
}

function onMutations(mutations) {
  return this.resolvedLanguages().then(
    langs => translateMutations(this, langs, mutations));
}

export function translateDocument(view, langs) {
  const html = view._doc.documentElement;

  if (readiness.has(html)) {
    return translateFragment(view, langs, html).then(
      () => setDOMAttrsAndEmit(html, langs)).then(
        () => langs.map(takeCode));
  }

  const translated =
    // has the document been already pre-translated?
    langs[0].code === html.getAttribute('lang') ?
      Promise.resolve() :
      translateFragment(view, langs, html).then(
        () => setDOMAttrs(html, langs));

  return translated.then(
    () => readiness.set(html, true)).then(
      () => langs.map(takeCode));
}

function setDOMAttrsAndEmit(html, langs) {
  setDOMAttrs(html, langs);
  html.parentNode.dispatchEvent(new CustomEvent('DOMRetranslated', {
    bubbles: false,
    cancelable: false,
    detail: {
      languages: langs.map(takeCode)
    }
  }));
}

function setDOMAttrs(html, langs) {
  html.setAttribute('lang', langs[0].code);
  html.setAttribute('dir', langs[0].dir);
}

function takeCode(lang) {
  return lang.code;
}
