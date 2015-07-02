'use strict';

import { getResourceLinks } from '../../bindings/html/head';
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

  emit(...args) {
    return this.service.env.emit(...args);
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
      langs => translateFragment(this, langs, frag));
  }
}

View.prototype.setAttributes = setAttributes;
View.prototype.getAttributes = getAttributes;

function onMutations(mutations) {
  return this.service.languages.then(
    langs => translateMutations(this, langs, mutations));
}

export function translate(langs) {
  dispatchEvent(this.doc, 'supportedlanguageschange', langs);
  // fetch the resources even if the document has been pretranslated
  return this.ctx.fetch(langs).then(
    translateDocument.bind(this, langs));
}

function translateDocument(langs) {
  let [view, doc] = [this, this.doc];
  let setDOMLocalized = function() {
    doc.localized = true;
    dispatchEvent(doc, 'DOMLocalized', langs);
  };

  if (langs[0].code === doc.documentElement.getAttribute('lang')) {
    return Promise.resolve(setDOMLocalized());
  }

  return translateFragment(view, langs, doc.documentElement).then(
    () => {
      doc.documentElement.lang = langs[0].code;
      doc.documentElement.dir = langs[0].dir;
      setDOMLocalized();
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
