'use strict';

import { documentReady, getDirection } from './shims';
import {
  setAttributes, getAttributes, translateFragment, translateMutations,
  getResourceLinks
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
    this.pseudo = {
      'qps-ploc': createPseudo(this, 'qps-ploc'),
      'qps-plocm': createPseudo(this, 'qps-plocm')
    };

    this._interactive = documentReady().then(
      () => init(this, client));

    const observer = new MutationObserver(onMutations.bind(this));
    this._observe = () => observer.observe(doc, observerConfig);
    this._disconnect = () => observer.disconnect();

    const translateView = langs => translateDocument(this, langs);
    client.on('translateDocument', translateView);
    this.ready = this._interactive.then(
      client => client.method('resolvedLanguages')).then(
      translateView);
  }

  requestLanguages(langs, global) {
    return this._interactive.then(
      client => client.method('requestLanguages', langs, global));
  }

  _resolveEntities(langs, keys) {
    return this._interactive.then(
      client => client.method('resolveEntities', client.id, langs, keys));
  }

  formatValue(id, args) {
    return this._interactive.then(
      client => client.method('formatValues', client.id, [[id, args]])).then(
      values => values[0]);
  }

  formatValues(...keys) {
    return this._interactive.then(
      client => client.method('formatValues', client.id, keys));
  }

  translateFragment(frag) {
    return this._interactive.then(
      client => client.method('resolvedLanguages')).then(
      langs => translateFragment(this, langs, frag));
  }
}

View.prototype.setAttributes = setAttributes;
View.prototype.getAttributes = getAttributes;

function createPseudo(view, code) {
  return {
    getName: () => view._interactive.then(
      client => client.method('getName', code)),
    processString: str => view._interactive.then(
      client => client.method('processString', code, str)),
  };
}

function init(view, client) {
  view._observe();
  return client.method(
    'registerView', client.id, getResourceLinks(view._doc.head)).then(
      () => client);
}

function onMutations(mutations) {
  return this._interactive.then(
    client => client.method('resolvedLanguages')).then(
    langs => translateMutations(this, langs, mutations));
}

export function translateDocument(view, langs) {
  const html = view._doc.documentElement;

  if (readiness.has(html)) {
    return translateFragment(view, langs, html).then(
      () => setDOMAttrsAndEmit(html, langs));
  }

  const translated =
    // has the document been already pre-translated?
    langs[0].code === html.getAttribute('lang') ?
      Promise.resolve() :
      translateFragment(view, langs, html).then(
        () => setDOMAttrs(html, langs));

  return translated.then(
    () => readiness.set(html, true));
}

function setDOMAttrsAndEmit(html, langs) {
  setDOMAttrs(html, langs);
  html.parentNode.dispatchEvent(new CustomEvent('DOMRetranslated', {
    bubbles: false,
    cancelable: false,
  }));
}

function setDOMAttrs(html, langs) {
  const codes = langs.map(lang => lang.code);
  html.setAttribute('langs', codes.join(' '));
  html.setAttribute('lang', codes[0]);
  html.setAttribute('dir', getDirection(codes[0]));
}
