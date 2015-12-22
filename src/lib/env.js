'use strict';

import { Context } from './context';
import PropertiesParser from './format/properties/parser';
import L20nParser from './format/l20n/entries/parser';
import { walkEntry, pseudo } from './pseudo';
import { emit, addEventListener, removeEventListener } from './events';

const parsers = {
  properties: PropertiesParser,
  l20n: L20nParser,
};

export class Env {
  constructor(fetchResource) {
    this.fetchResource = fetchResource;

    this.resCache = new Map();
    this.resRefs = new Map();
    this.numberFormatters = null;

    const listeners = {};
    this.emit = emit.bind(this, listeners);
    this.addEventListener = addEventListener.bind(this, listeners);
    this.removeEventListener = removeEventListener.bind(this, listeners);
  }

  createContext(langs, resIds) {
    const ctx = new Context(this, langs, resIds);
    resIds.forEach(resId => {
      const usedBy = this.resRefs.get(resId) || 0;
      this.resRefs.set(resId, usedBy + 1);
    });

    return ctx;
  }

  destroyContext(ctx) {
    ctx.resIds.forEach(resId => {
      const usedBy = this.resRefs.get(resId) || 0;

      if (usedBy > 1) {
        return this.resRefs.set(resId, usedBy - 1);
      }

      this.resRefs.delete(resId);
      this.resCache.forEach((val, key) =>
        key.startsWith(resId) ? this.resCache.delete(key) : null);
    });
  }

  _parse(syntax, lang, data) {
    const parser = parsers[syntax];
    if (!parser) {
      return data;
    }

    const emit = (type, err) => this.emit(type, amendError(lang, err));
    return parser.parse.call(parser, emit, data);
  }

  _create(lang, entries) {
    if (lang.src !== 'pseudo') {
      return entries;
    }

    const pseudoentries = Object.create(null);
    for (let key in entries) {
      pseudoentries[key] = walkEntry(
        entries[key], pseudo[lang.code].process);
    }
    return pseudoentries;
  }

  _getResource(lang, res) {
    const cache = this.resCache;
    const id = res + lang.code + lang.src;

    if (cache.has(id)) {
      return cache.get(id);
    }

    const syntax = res.substr(res.lastIndexOf('.') + 1);

    const saveEntries = data => {
      const entries = this._parse(syntax, lang, data);
      cache.set(id, this._create(lang, entries));
    };

    const recover = err => {
      err.lang = lang;
      this.emit('fetcherror', err);
      cache.set(id, err);
    };

    const langToFetch = lang.src === 'pseudo' ?
      { code: 'en-US', src: 'app', ver: lang.ver } :
      lang;

    const resource = this.fetchResource(res, langToFetch)
      .then(saveEntries, recover);

    cache.set(id, resource);

    return resource;
  }
}

export function amendError(lang, err) {
  err.lang = lang;
  return err;
}
