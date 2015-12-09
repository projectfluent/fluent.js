'use strict';

import { Env } from '../../lib/env';
import { pseudo } from '../../lib/pseudo';
import { negotiateLanguages } from './langs';

export class Remote {
  constructor(fetchResource, broadcast) {
    this.broadcast = broadcast;
    this.env = new Env(fetchResource);
    this.ctxs = new Map();
    this.langs = new Map();
  }

  registerView(view, resources, meta, additionalLangs, requestedLangs) {
    this.ctxs.set(view, this.env.createContext(resources));
    const { langs } = negotiateLanguages(
      meta, additionalLangs, [], requestedLangs);
    this.langs.set(view, langs);
    return langs;
  }

  unregisterView(view) {
    this.ctxs.delete(view);
    this.langs.delete(view);
    return true;
  }

  resolveEntities(view, langs, keys) {
    return this.ctxs.get(view).resolveEntities(langs, keys);
  }

  formatValues(view, keys) {
    // XXX simplify by making ctx immutable
    return this.ctxs.get(view).resolveValues(
      this.langs.get(view), keys);
  }

  // XXX remove when ctxs are immutable
  resolvedLanguages(view) {
    return this.langs.get(view);
  }

  changeLanguages(view, meta, additionalLangs, requestedLangs) {
    const prevLangs = this.langs.get(view) || [];
    const { langs, haveChanged } = negotiateLanguages(
      meta, additionalLangs, prevLangs, requestedLangs);
    this.langs.set(view, langs);
    return { langs, haveChanged };
  }

  requestLanguages(requestedLangs) {
    this.broadcast('languageschangerequest', requestedLangs);
  }

  getName(code) {
    return pseudo[code].name;
  }

  processString(code, str) {
    return pseudo[code].process(str);
  }
}
