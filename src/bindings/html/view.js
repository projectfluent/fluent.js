'use strict';

import { documentReady, getDirection } from './shims';
import { getResourceLinks, getMeta } from './head';
import {
  setAttributes, getAttributes, translateFragment, translateMutations,
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
      'fr-x-psaccent': createPseudo(this, 'fr-x-psaccent'),
      'ar-x-psbidi': createPseudo(this, 'ar-x-psbidi')
    };

    const initialized = documentReady().then(() => init(this, client));
    this._interactive = initialized.then(() => client);
    this.ready = initialized.then(langs => translateDocument(this, langs));

    const observer = new MutationObserver(onMutations.bind(this));
    this._observe = () => observer.observe(doc, observerConfig);
    this._disconnect = () => observer.disconnect();

    client.on('languageschangerequest',
      requestedLangs => this.requestLanguages(requestedLangs));
  }

  requestLanguages(requestedLangs, isGlobal) {
    const method = isGlobal ?
      client => client.method('requestLanguages', requestedLangs) :
      client => changeLanguages(this, client, requestedLangs);
    return this._interactive.then(method);
  }

  handleEvent() {
    return this.requestLanguages(navigator.languages);
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
      client => client.method('resolvedLanguages', client.id)).then(
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
  const resources = getResourceLinks(view._doc.head);
  const meta = getMeta(view._doc.head);
  // XXX move this to remote when sw land
  return getAdditionalLanguages().then(
    additionalLangs => client.method(
      'registerView', client.id, resources, meta, additionalLangs,
      navigator.languages));
}

function changeLanguages(view, client, requestedLangs) {
  const meta = getMeta(view._doc.head);
  return getAdditionalLanguages()
    .then(additionalLangs => client.method(
      'changeLanguages', client.id, meta, additionalLangs, requestedLangs
    ))
    .then(({langs, haveChanged}) => haveChanged ?
      translateDocument(view, langs) : undefined
    );
}

function getAdditionalLanguages() {
  if (navigator.mozApps && navigator.mozApps.getAdditionalLanguages) {
    return navigator.mozApps.getAdditionalLanguages()
      .catch(() => Object.create(null));
  }

  return Promise.resolve(Object.create(null));
}

function onMutations(mutations) {
  return this._interactive.then(
    client => client.method('resolvedLanguages', client.id)).then(
    langs => translateMutations(this, langs, mutations));
}

export function translateDocument(view, langs) {
  const html = view._doc.documentElement;

  if (readiness.has(html)) {
    return translateFragment(view, langs, html).then(
      () => setAllAndEmit(html, langs));
  }

  const translated =
    // has the document been already pre-translated?
    langs[0].code === html.getAttribute('lang') ?
      Promise.resolve() :
      translateFragment(view, langs, html).then(
        () => setLangDir(html, langs));

  return translated.then(() => {
    setLangs(html, langs);
    readiness.set(html, true);
  });
}

function setLangs(html, langs) {
  const codes = langs.map(lang => lang.code);
  html.setAttribute('langs', codes.join(' '));
}

function setLangDir(html, langs) {
  const code = langs[0].code;
  html.setAttribute('lang', code);
  html.setAttribute('dir', getDirection(code));
}

function setAllAndEmit(html, langs) {
  setLangDir(html, langs);
  setLangs(html, langs);
  html.parentNode.dispatchEvent(new CustomEvent('DOMRetranslated', {
    bubbles: false,
    cancelable: false,
  }));
}
