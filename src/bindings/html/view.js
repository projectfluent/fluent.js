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
      mutations => onMutations(this, mutations));
    this.observe = () => observer.observe(this.doc, observerConfig);
    this.disconnect = () => observer.disconnect();

    this.observe();
  }

  formatValue(id, args) {
    return this.ctx.formatValue(this.service.languages, id, args);
  }

  formatEntity(id, args) {
    return this.ctx.formatEntity(this.service.languages, id, args);
  }

  translateFragment(frag) {
    return translateFragment(this, frag);
  }
}

View.prototype.setAttributes = setL10nAttributes;
View.prototype.getAttributes = getL10nAttributes;

export function init(langs) {
  dispatchEvent(this.doc, 'supportedlanguageschange', langs);
  return translateDocument(this, this.doc, langs);
}

function onMutations(view, mutations) {
  let mutation;
  let targets = new Set();

  for (var i = 0; i < mutations.length; i++) {
    mutation = mutations[i];

    if (mutation.type === 'childList') {
      for (var j = 0; j < mutation.addedNodes.length; j++) {
        let addedNode = mutation.addedNodes[j];
        if (addedNode.nodeType === Node.ELEMENT_NODE) {
          targets.add(addedNode);
        }
      }
    }

    if (mutation.type === 'attributes') {
      translateElement(view, mutation.target);
    }
  }

  targets.forEach(function(target) {
    if (target.childElementCount) {
      translateFragment(view, target);
    } else if (target.hasAttribute('data-l10n-id')) {
      translateElement(view, target);
    }
  });
}
