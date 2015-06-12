'use strict';

import { getResourceLinks } from '../../bindings/html/head';
import {
  setAttributes, getAttributes, dispatchEvent,
  translateDocument, translateFragment, translateMutations
} from './dom';

const observerConfig = {
  attributes: true,
  characterData: false,
  childList: true,
  subtree: true,
  attributeFilter: ['data-l10n-id', 'data-l10n-args']
};

export class View {
  constructor(service, doc) {
    this.service = service;
    this.doc = doc;
    this.ctx = this.service.env.createContext(getResourceLinks(doc.head));

    this.ready = new Promise(function(resolve) {
      let viewReady = function(evt) {
        doc.removeEventListener('DOMLocalized', viewReady);
        resolve(evt.detail.languages);
      };
      doc.addEventListener('DOMLocalized', viewReady);
    });

    let observer = new MutationObserver(onMutations.bind(this));
    this.observe = () => observer.observe(this.doc, observerConfig);
    this.disconnect = () => observer.disconnect();

    this.observe();
  }

  formatValue(id, args) {
    return this.service.languages.then(
      langs => this.ctx.formatValue(langs, id, args));
  }

  formatEntity(id, args) {
    return this.service.languages.then(
      langs => this.ctx.formatEntity(langs, id, args));
  }

  translateFragment(frag) {
    return this.service.languages.then(
      langs => translateFragment(this.ctx, this, langs, frag));
  }
}

View.prototype.setAttributes = setAttributes;
View.prototype.getAttributes = getAttributes;

export function translate(langs) {
  dispatchEvent(this.doc, 'supportedlanguageschange', langs);
  // fetch the resources even if the document has been pretranslated
  return this.ctx.fetch(langs).then(
    () => translateDocument(this.ctx, this, langs, this.doc));
}

function onMutations(mutations) {
  return this.service.languages.then(
    langs => translateMutations(this.ctx, this, langs, mutations));
}
