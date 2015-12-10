'use strict';

import { Env } from '../../lib/env';
import { pseudo } from '../../lib/pseudo';
import { negotiateLanguages } from './langs';

export class Remote {
  constructor(fetchResource, broadcast) {
    this.broadcast = broadcast;
    this.env = new Env(fetchResource);
    this.ctxs = new Map();
  }

  registerView(view, resources, meta, additionalLangs, requestedLangs) {
    const { langs } = negotiateLanguages(
      meta, additionalLangs, [], requestedLangs);
    this.ctxs.set(view, this.env.createContext(langs, resources));
    return langs;
  }

  unregisterView(view) {
    this.ctxs.delete(view);
    return true;
  }

  formatEntities(view, keys) {
    return this.ctxs.get(view).formatEntities(...keys);
  }

  formatValues(view, keys) {
    return this.ctxs.get(view).formatValues(...keys);
  }

  changeLanguages(view, meta, additionalLangs, requestedLangs) {
    const oldCtx = this.ctxs.get(view);
    const prevLangs = oldCtx.langs;
    const newLangs = negotiateLanguages(
      meta, additionalLangs, prevLangs, requestedLangs);
    this.ctxs.set(view, this.env.createContext(
      newLangs.langs, oldCtx.resIds));
    return newLangs;
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
