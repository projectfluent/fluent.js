'use strict';

import { getResourceLinks } from '../../bindings/html/head';
import MozL10nMutationObserver from './observer';

export function View(service, doc) {
  this.service = service;
  this.doc = doc;

  this.ctx = this.service.env.createContext(getResourceLinks(doc.head));
  this.observer = new MozL10nMutationObserver();
}

View.prototype.formatEntity = function(id, args) {
  return this.ctx.formatEntity(this.service.languages, id, args);
};
