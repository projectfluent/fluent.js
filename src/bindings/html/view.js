'use strict';

import { getResourceLinks } from '../../bindings/html/head';
import {
  setL10nAttributes, getL10nAttributes, dispatchEvent,
  translateDocument, translateFragment, translateElement
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

    let observer = new MutationObserver(
      mutations => this.service.languages.then(
        langs => onMutations(this.ctx, this, langs, mutations)));
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

View.prototype.setAttributes = setL10nAttributes;
View.prototype.getAttributes = getL10nAttributes;

export function translate(langs) {
  dispatchEvent(this.doc, 'supportedlanguageschange', langs);
  return translateDocument(this.ctx, this, langs, this.doc);
}

function onMutations(ctx, obs, langs, mutations) {
  let targets = new Set();

  for (let mutation of mutations) {
    switch (mutation.type) {
      case 'attributes':
        translateElement(ctx, obs, langs, mutation.target);
        break;
      case 'childList':
        for (let addedNode of mutation.addedNodes) {
          if (addedNode.nodeType === Node.ELEMENT_NODE) {
            targets.add(addedNode);
          }
        }
    }
  }

  targets.forEach(
    target => target.childElementCount ?
      translateFragment(ctx, obs, langs, target) :
      translateElement(ctx, obs, langs, target));
}
