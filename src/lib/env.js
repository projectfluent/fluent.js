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
  constructor(defaultLang, fetch) {
    this.defaultLang = defaultLang;
    this.fetch = fetch;

    this._resLists = new Map();
    this._resCache = new Map();

    const listeners = {};
    this.emit = emit.bind(this, listeners);
    this.addEventListener = addEventListener.bind(this, listeners);
    this.removeEventListener = removeEventListener.bind(this, listeners);
  }

  createContext(resIds) {
    const ctx = new Context(this);
    this._resLists.set(ctx, new Set(resIds));
    return ctx;
  }

  destroyContext(ctx) {
    const lists = this._resLists;
    const resList = lists.get(ctx);

    lists.delete(ctx);
    resList.forEach(
      resId => deleteIfOrphan(this._resCache, lists, resId));
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
    const cache = this._resCache;
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
      { code: this.defaultLang, src: 'app' } :
      lang;

    const resource = this.fetch(res, langToFetch).then(
      saveEntries, recover);

    cache.set(id, resource);

    return resource;
  }
}

function deleteIfOrphan(cache, lists, resId) {
  const isNeeded = Array.from(lists).some(
    ([ctx, resIds]) => resIds.has(resId));

  if (!isNeeded) {
    cache.forEach((val, key) =>
      key.startsWith(resId) ? cache.delete(key) : null);
  }
}

export function amendError(lang, err) {
  err.lang = lang;
  return err;
}
