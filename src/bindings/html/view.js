'use strict';

import { qps } from '../../lib/pseudo';
import { getResourceLinks } from './head';
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
  constructor(doc) {
    this.doc = doc;
    this.qps = qps;

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

  }

  init(service) {
    this.service = service.register(this, getResourceLinks(this.doc.head));
    this.observe();
  }

  get languages() {
    return this.service.languages;
  }

  set languages(langs) {
    return this.service.requestLanguages(langs);
  }

  emit(...args) {
    return this.service.env.emit(...args);
  }

  _resolveEntity(langs, id, args) {
    return this.service.resolveEntity(this, langs, id, args);
  }

  formatValue(id, args) {
    return this.service.initView(this).then(
      langs => this.service.resolveValue(this, langs, id, args));
  }

  translateFragment(frag) {
    return this.service.initView(this).then(
      langs => translateFragment(this, langs, frag));
  }
}

View.prototype.setAttributes = setAttributes;
View.prototype.getAttributes = getAttributes;

function onMutations(mutations) {
  return this.service.initView(this).then(
    langs => translateMutations(this, langs, mutations));
}

export function translate(langs) {
  return translateDocument.call(this, langs);
}

function translateDocument(langs) {
  const [view, doc] = [this, this.doc];

  if (langs[0].code === doc.documentElement.getAttribute('lang')) {
    return Promise.resolve.then(
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
